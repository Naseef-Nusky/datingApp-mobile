import axios from 'axios';

const PENDING_KEY = 'pendingStripeCheckout';
const HANDLED_PREFIX = 'stripe-payment-handled';

export function setPendingStripeCheckout({ sessionId, kind }) {
  if (!sessionId || !kind) return;
  sessionStorage.setItem(
    PENDING_KEY,
    JSON.stringify({ sessionId, kind, at: Date.now() }),
  );
  console.info('[Stripe] Pending checkout saved for resume confirm', { sessionId, kind });
}

export function clearPendingStripeCheckout() {
  sessionStorage.removeItem(PENDING_KEY);
}

export function getPendingStripeCheckout() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.sessionId || !parsed?.kind) return null;
    if (Date.now() - (parsed.at || 0) > 30 * 60 * 1000) {
      clearPendingStripeCheckout();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isStripePaymentAlreadyHandled(kind, sessionId) {
  return Boolean(sessionStorage.getItem(`${HANDLED_PREFIX}-${kind}-${sessionId}`));
}

export function markStripePaymentHandled(kind, sessionId) {
  sessionStorage.setItem(`${HANDLED_PREFIX}-${kind}-${sessionId}`, '1');
}

export function unmarkStripePaymentHandled(kind, sessionId) {
  sessionStorage.removeItem(`${HANDLED_PREFIX}-${kind}-${sessionId}`);
}

/**
 * Confirm a Stripe checkout session with the backend (idempotent if already paid).
 */
export async function confirmStripePayment(sessionId, kind) {
  const confirmPath =
    kind === 'upgrade'
      ? '/api/credits/confirm-payment'
      : '/api/credits/confirm-refill-payment';

  console.info('[Stripe] Confirming payment with backend:', confirmPath, { session_id: sessionId });

  const res = await axios.post(confirmPath, { session_id: sessionId });
  return res;
}

export function stripeSuccessMessage(kind, data) {
  if (kind === 'upgrade') {
    return 'Payment successful! Your subscription is active.';
  }
  const added = data?.creditsAdded;
  return added ? `Credits added: ${added}` : 'Credits added successfully.';
}
