/**
 * Google Analytics 4 (gtag). Enabled when VITE_GA_MEASUREMENT_ID is set at build time.
 * Google Ads (AW-18191033904) is loaded globally from index.html.
 * @see https://developers.google.com/analytics/devguides/collection/ga4
 */

export const GOOGLE_ADS_ID = 'AW-18191033904';

/** Sign-up conversion (Google Ads event snippet). */
export const GOOGLE_ADS_SIGNUP_CONVERSION_SEND_TO =
  'AW-18191033904/2xsKCMyhg7QcELDMlOJD';

export const GOOGLE_ADS_SIGNUP_CONVERSION_VALUE = 1.0;
export const GOOGLE_ADS_SIGNUP_CONVERSION_CURRENCY = 'GBP';

/**
 * Google Ads sign-up conversion — fires on registration confirmed page/modal.
 * @param {() => void} [eventCallback] optional, e.g. navigate after ping
 */
export function trackGoogleAdsConversion(eventCallback) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const params = {
    send_to: GOOGLE_ADS_SIGNUP_CONVERSION_SEND_TO,
    value: GOOGLE_ADS_SIGNUP_CONVERSION_VALUE,
    currency: GOOGLE_ADS_SIGNUP_CONVERSION_CURRENCY,
  };
  if (typeof eventCallback === 'function') {
    params.event_callback = eventCallback;
  }
  window.gtag('event', 'conversion', params);
}

/**
 * Click-based conversion (optional). Use on submit if you need redirect after track.
 * @param {string} [url]
 * @returns {false}
 */
export function gtagReportConversion(url) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    if (typeof url !== 'undefined') window.location = url;
    return false;
  }
  trackGoogleAdsConversion(() => {
    if (typeof url !== 'undefined') window.location = url;
  });
  return false;
}

export function initGoogleAnalytics() {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/**
 * @param {string} path pathname + search, e.g. /dashboard?x=1
 */
export function trackPageView(path) {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/**
 * @param {string} name event name (snake_case recommended in GA4)
 * @param {Record<string, string | number | boolean>} [params]
 */
export function trackEvent(name, params = {}) {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
