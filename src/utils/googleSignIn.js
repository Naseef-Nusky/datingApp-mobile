import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { mobileApiUrl } from '../api/mobileApi';

/** Google blocks OAuth inside embedded WebViews — open Safari/Chrome Custom Tab on native. */
export async function openGoogleSignIn() {
  const platformQuery = Capacitor.isNativePlatform() ? '?platform=mobile' : '';
  const url = `${mobileApiUrl('/api/auth/google')}${platformQuery}`;
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
    return;
  }
  window.location.href = url;
}
