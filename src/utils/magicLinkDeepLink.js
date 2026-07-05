import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { closeStripeBrowserWithRetry, isStripePaymentReturnUrl } from './stripeCheckout.js';

const APP_PATH_PREFIXES = [
  '/auth/login-callback',
  '/auth/google-callback',
  '/register',
  '/login',
  '/signup-email',
  '/complete-profile',
  '/dashboard',
  '/profile',
  '/stripe-return',
];

function extractToken(url) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('token');
  } catch {
    const match = url.match(/[?&#]token=([^&#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

function pathFromUrl(url) {
  try {
    const parsed = new URL(url);
    // Custom scheme: com.vantagedating.app://stripe-return?… → host is the route name
    if (parsed.protocol && !parsed.protocol.startsWith('http')) {
      const host = parsed.hostname || parsed.host?.split(':')[0];
      if (host) {
        return host.startsWith('/') ? host : `/${host}`;
      }
    }
    if (parsed.pathname && parsed.pathname !== '/') {
      return parsed.pathname;
    }
  } catch {
    const withoutScheme = url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
    const q = withoutScheme.indexOf('?');
    const pathPart = q === -1 ? withoutScheme : withoutScheme.slice(0, q);
    if (pathPart && !pathPart.startsWith('/')) {
      return `/${pathPart}`;
    }
    const slash = withoutScheme.indexOf('/');
    if (slash === -1) return '';
    const pathAndQuery = withoutScheme.slice(slash);
    const queryStart = pathAndQuery.indexOf('?');
    return queryStart === -1 ? pathAndQuery : pathAndQuery.slice(0, queryStart);
  }
  return '';
}

function queryFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.search || '';
  } catch {
    const q = url.indexOf('?');
    return q === -1 ? '' : url.slice(q);
  }
}

/**
 * Handle custom scheme, Universal Links (https), and cold-start URLs.
 */
export function handleAppDeepLink(url) {
  if (!url || typeof url !== 'string') return;

  const lower = url.toLowerCase();
  const path = pathFromUrl(url);
  const query = queryFromUrl(url);

  if (lower.includes('login-callback')) {
    const token = extractToken(url);
    if (token) {
      window.location.replace(`/auth/login-callback?token=${encodeURIComponent(token)}`);
    }
    return;
  }

  if (lower.includes('google-callback')) {
    void closeStripeBrowserWithRetry();
    window.location.replace(`/auth/google-callback${query}`);
    return;
  }

  // Stripe payment return — custom scheme opens app; close in-app browser and land on dashboard
  if (isStripePaymentReturnUrl(url)) {
    console.info('[Stripe] Payment return deep link received:', url);
    void closeStripeBrowserWithRetry();
    let paymentPath = path && path !== '/' ? path : '/dashboard';
    if (paymentPath === '/stripe-return') paymentPath = '/dashboard';
    const target = `${paymentPath}${query}`;
    console.info('[Stripe] Navigating to:', target);
    window.location.replace(target);
    return;
  }

  const matched = APP_PATH_PREFIXES.find(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
  if (matched) {
    window.location.replace(`${matched}${query}`);
  }
}

/**
 * iOS / Android: magic-link emails and Universal Links (https://app…/auth/login-callback?token=).
 */
export async function initMagicLinkDeepLinks() {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appUrlOpen', ({ url }) => {
    handleAppDeepLink(url);
  });

  Browser.addListener('browserFinished', () => {
    console.info('[Stripe] In-app browser finished');
    window.dispatchEvent(new CustomEvent('stripe-browser-closed'));
  });

  try {
    const launched = await App.getLaunchUrl();
    if (launched?.url) handleAppDeepLink(launched.url);
  } catch {
    /* no cold-start URL */
  }
}
