import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

/**
 * True when Sign in with Apple should be offered (Capacitor iOS shell).
 * Web/Android: use email/password or magic link (Apple web flow not wired here).
 */
export function isNativeIos() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * @returns {Promise<string>} identityToken (JWT) for POST /api/auth/apple
 */
export async function authorizeAppleSignIn() {
  const clientId =
    import.meta.env.VITE_APPLE_NATIVE_CLIENT_ID || 'com.vantagedating.app';
  const redirectURI =
    import.meta.env.VITE_APPLE_REDIRECT_URI ||
    (typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://vantagedating.com/');

  const result = await SignInWithApple.authorize({
    clientId,
    redirectURI,
    scopes: 'email name',
  });

  const token = result?.response?.identityToken;
  if (!token) {
    throw new Error('No identity token from Apple');
  }
  return {
    identityToken: token,
    givenName: result?.response?.givenName || '',
    familyName: result?.response?.familyName || '',
  };
}
