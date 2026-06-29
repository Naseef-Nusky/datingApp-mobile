import { Capacitor } from '@capacitor/core';

/** Request body for POST /api/auth/send-login-link. */
export function buildSendLoginLinkPayload(email) {
  const trimmed = typeof email === 'string' ? email.trim() : email;
  const body = { email: trimmed };
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    body.linkDelivery = 'ios-native';
  }
  return body;
}
