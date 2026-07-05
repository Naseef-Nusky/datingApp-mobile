import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { setPendingStripeCheckout } from './stripePayment.js';

/**
 * Open Stripe Checkout in the native in-app browser (mobile-responsive Safari sheet).
 * The main app keeps running and polls for payment completion, then closes the browser.
 */
export async function openStripeCheckout(checkoutUrl, { sessionId, kind } = {}) {
  if (!checkoutUrl) {
    throw new Error('Missing Stripe checkout URL');
  }

  if (sessionId && kind) {
    setPendingStripeCheckout({ sessionId, kind });
  }

  console.info('[Stripe] Opening checkout in in-app browser:', checkoutUrl, { sessionId, kind });

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: checkoutUrl, presentationStyle: 'fullscreen' });
    window.dispatchEvent(new CustomEvent('stripe-checkout-opened'));
    return;
  }

  window.location.assign(checkoutUrl);
}

/** Close the Stripe in-app browser after successful payment. */
export async function closeStripeBrowser() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Browser.close();
    console.info('[Stripe] In-app browser closed');
    window.dispatchEvent(new CustomEvent('stripe-browser-closed'));
  } catch {
    /* already closed */
  }
}

/** Retry close — iOS may need a moment after payment completes. */
export async function closeStripeBrowserWithRetry() {
  if (!Capacitor.isNativePlatform()) return;
  for (const delayMs of [0, 250, 600, 1200]) {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    try {
      await Browser.close();
      console.info('[Stripe] In-app browser closed after payment');
      window.dispatchEvent(new CustomEvent('stripe-browser-closed'));
      return;
    } catch {
      /* retry */
    }
  }
}

export function isStripePaymentReturnUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('refill=success') ||
    lower.includes('upgrade=success') ||
    lower.includes('refill=cancelled') ||
    lower.includes('upgrade=cancelled')
  );
}
