import { Capacitor } from '@capacitor/core';

/** True when running inside Capacitor (iOS/Android shell). */
export function isNative() {
  return Capacitor.isNativePlatform();
}

/** True when running in a normal browser (web preview or mobile browser). */
export function isWeb() {
  return !Capacitor.isNativePlatform();
}

export function isIos() {
  return isNative() && Capacitor.getPlatform() === 'ios';
}

export function isAndroid() {
  return isNative() && Capacitor.getPlatform() === 'android';
}
