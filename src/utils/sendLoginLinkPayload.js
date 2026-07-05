import { Capacitor } from '@capacitor/core';

/** Request body for POST /api/auth/send-login-link. */
export function buildSendLoginLinkPayload(email) {
  const trimmed = typeof email === 'string' ? email.trim() : email;
  const body = { email: trimmed };
  // Native Capacitor app → email link opens the app (com.vantagedating.app://…), not Safari.
  if (Capacitor.isNativePlatform()) {
    body.linkDelivery = 'ios-native';
  }
  return body;
}
