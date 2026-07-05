import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import {
  confirmStripePayment,
  clearPendingStripeCheckout,
  getPendingStripeCheckout,
  isStripePaymentAlreadyHandled,
  markStripePaymentHandled,
  unmarkStripePaymentHandled,
  stripeSuccessMessage,
} from '../utils/stripePayment';
import { closeStripeBrowserWithRetry } from '../utils/stripeCheckout';

function isPaymentNotCompletedError(err) {
  const msg = String(err.response?.data?.message || err.message || '').toLowerCase();
  return err.response?.status === 400 && (msg.includes('not completed') || msg.includes('payment not'));
}

/**
 * Confirms Stripe checkout and auto-closes the in-app browser when payment succeeds.
 */
export default function useStripePaymentReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchUser, refreshCreditBalance } = useAuth();
  const handledRef = useRef(null);
  const confirmingRef = useRef(false);

  const runConfirm = useCallback(
    async (sessionId, kind, { cleanUrlAfter = false, silentIfNotPaid = false, closeBrowserOnSuccess = false } = {}) => {
      const storageKey = `stripe-payment-handled-${kind}-${sessionId}`;
      if (handledRef.current === storageKey || isStripePaymentAlreadyHandled(kind, sessionId)) {
        return false;
      }
      if (confirmingRef.current) return false;

      confirmingRef.current = true;
      handledRef.current = storageKey;
      markStripePaymentHandled(kind, sessionId);

      console.info('[Stripe] Payment success detected', { kind, sessionId });

      try {
        const res = await confirmStripePayment(sessionId, kind);

        console.info('[Stripe] Payment confirmed successfully', {
          kind,
          sessionId,
          response: res.data,
        });

        clearPendingStripeCheckout();
        await fetchUser();
        await refreshCreditBalance();

        console.info('[Stripe] User credits refreshed after payment');
        window.dispatchEvent(new CustomEvent('stripe-payment-confirmed'));

        if (closeBrowserOnSuccess) {
          await closeStripeBrowserWithRetry();
        }

        if (cleanUrlAfter) {
          navigate(location.pathname, { replace: true, state: location.state || {} });
        }

        alert(stripeSuccessMessage(kind, res.data));
        return true;
      } catch (err) {
        if (silentIfNotPaid && isPaymentNotCompletedError(err)) {
          console.info('[Stripe] Payment not completed yet', { sessionId, kind });
          handledRef.current = null;
          unmarkStripePaymentHandled(kind, sessionId);
          return false;
        }

        console.error('[Stripe] Payment confirmation failed', {
          kind,
          sessionId,
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
        });

        handledRef.current = null;
        unmarkStripePaymentHandled(kind, sessionId);

        if (cleanUrlAfter) {
          navigate(location.pathname, { replace: true, state: location.state || {} });
        }

        if (!silentIfNotPaid) {
          const msg =
            err.response?.data?.message ||
            'Could not confirm payment. Credits may still be applied shortly.';
          alert(msg);
        }

        return false;
      } finally {
        confirmingRef.current = false;
      }
    },
    [fetchUser, refreshCreditBalance, navigate, location.pathname, location.state],
  );

  const tryPendingConfirm = useCallback(
    async (options = {}) => {
      const pending = getPendingStripeCheckout();
      if (!pending) return;
      console.info('[Stripe] Checking pending payment', pending);
      await runConfirm(pending.sessionId, pending.kind, {
        silentIfNotPaid: true,
        closeBrowserOnSuccess: true,
        ...options,
      });
    },
    [runConfirm],
  );

  const confirmPendingManually = useCallback(
    (pending) => {
      if (!pending?.sessionId || !pending?.kind) return;
      console.info('[Stripe] Manual confirm tapped', pending);
      runConfirm(pending.sessionId, pending.kind, {
        silentIfNotPaid: false,
        closeBrowserOnSuccess: true,
      });
    },
    [runConfirm],
  );

  // URL query params (deep link / legacy return)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    const upgradeSuccess = params.get('upgrade') === 'success';
    const refillSuccess = params.get('refill') === 'success';

    if (!sessionId || (!upgradeSuccess && !refillSuccess)) return;

    void closeStripeBrowserWithRetry();
    const kind = upgradeSuccess ? 'upgrade' : 'refill';
    runConfirm(sessionId, kind, { cleanUrlAfter: true, closeBrowserOnSuccess: true });
  }, [location.search, runConfirm]);

  // Poll while checkout is pending — auto-close browser when Stripe payment completes
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let pollId = null;

    const startPolling = () => {
      if (pollId) return;
      pollId = setInterval(() => {
        if (!getPendingStripeCheckout()) {
          clearInterval(pollId);
          pollId = null;
          return;
        }
        void tryPendingConfirm();
      }, 2000);
    };

    const stopPolling = () => {
      if (pollId) {
        clearInterval(pollId);
        pollId = null;
      }
    };

    const onCheckoutOpened = () => startPolling();
    const onBrowserClosed = () => {
      stopPolling();
      setTimeout(() => tryPendingConfirm({ silentIfNotPaid: false }), 400);
    };
    const onPaymentConfirmed = () => stopPolling();

    window.addEventListener('stripe-checkout-opened', onCheckoutOpened);
    window.addEventListener('stripe-browser-closed', onBrowserClosed);
    window.addEventListener('stripe-payment-confirmed', onPaymentConfirmed);
    window.addEventListener('stripe-confirm-pending', onBrowserClosed);

    if (getPendingStripeCheckout()) startPolling();

    let resumeTimer = null;
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => tryPendingConfirm(), 500);
    });

    return () => {
      stopPolling();
      clearTimeout(resumeTimer);
      listener.then((l) => l.remove()).catch(() => {});
      window.removeEventListener('stripe-checkout-opened', onCheckoutOpened);
      window.removeEventListener('stripe-browser-closed', onBrowserClosed);
      window.removeEventListener('stripe-payment-confirmed', onPaymentConfirmed);
      window.removeEventListener('stripe-confirm-pending', onBrowserClosed);
    };
  }, [tryPendingConfirm]);

  return { confirmPendingManually };
}
