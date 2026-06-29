import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

function navigateLoginCallback(url) {
  if (!url || typeof url !== 'string') return;
  if (!url.toLowerCase().includes('login-callback')) return;

  let token = null;
  try {
    const parsed = new URL(url);
    token = parsed.searchParams.get('token');
  } catch {
    const match = url.match(/[?&#]token=([^&#]+)/);
    token = match ? decodeURIComponent(match[1]) : null;
  }

  if (!token) return;
  window.location.replace(`/auth/login-callback?token=${encodeURIComponent(token)}`);
}

/**
 * iOS / Android native: magic-link emails may use custom scheme (e.g. com.vantagedating.app://auth/login-callback?token=).
 */
export async function initMagicLinkDeepLinks() {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appUrlOpen', ({ url }) => {
    navigateLoginCallback(url);
  });

  try {
    const launched = await App.getLaunchUrl();
    if (launched?.url) navigateLoginCallback(launched.url);
  } catch {
    /* no cold-start URL */
  }
}
