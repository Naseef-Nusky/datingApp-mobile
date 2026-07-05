import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { getPendingStripeCheckout } from '../utils/stripePayment';

/**
 * When user returns to the app after Stripe checkout, offer a tap-to-confirm banner.
 */
export default function StripePendingBanner({ onConfirmPending }) {
  const [pending, setPending] = useState(null);

  const refreshPending = useCallback(() => {
    setPending(getPendingStripeCheckout());
  }, []);

  useEffect(() => {
    refreshPending();
    const id = setInterval(refreshPending, 1500);
    return () => clearInterval(id);
  }, [refreshPending]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        setTimeout(refreshPending, 300);
      }
    });

    const onBrowserClosed = () => setTimeout(refreshPending, 300);

    window.addEventListener('stripe-browser-closed', onBrowserClosed);
    window.addEventListener('stripe-payment-confirmed', refreshPending);

    return () => {
      listener.then((l) => l.remove()).catch(() => {});
      window.removeEventListener('stripe-browser-closed', onBrowserClosed);
      window.removeEventListener('stripe-payment-confirmed', refreshPending);
    };
  }, [refreshPending]);

  if (!pending) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[140] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto bg-teal-600 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium leading-snug">
          Finished paying? Tap to update your credits.
        </p>
        <button
          type="button"
          onClick={() => onConfirmPending?.(pending)}
          className="shrink-0 bg-white text-teal-700 font-semibold text-sm px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
