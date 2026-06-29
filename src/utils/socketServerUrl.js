import { Capacitor } from '@capacitor/core';
import io from 'socket.io-client';

/**
 * Socket.IO URL strategy:
 * - Production app (app.*): same-origin /socket.io via nginx (avoids cross-origin WebSocket/CORS).
 * - Native Capacitor: VITE_API_URL (or VITE_SOCKET_URL).
 * - Dev: Vite origin when API is local (proxy); else VITE_API_URL.
 *
 * Returns null = connect to window.location (same origin).
 */
export function getSocketServerUrl() {
  const socketOverride = (import.meta.env.VITE_SOCKET_URL || '').replace(/\/$/, '');
  if (socketOverride) return socketOverride;

  const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  if (typeof window === 'undefined') {
    return apiUrl || 'http://localhost:5000';
  }

  if (Capacitor.isNativePlatform()) {
    return apiUrl || 'http://localhost:5000';
  }

  if (import.meta.env.DEV) {
    if (!apiUrl) return window.location.origin;
    try {
      const api = new URL(apiUrl);
      const localApi =
        api.hostname === 'localhost' ||
        api.hostname === '127.0.0.1' ||
        /^192\.168\./.test(api.hostname);
      if (localApi) return window.location.origin;
    } catch {
      /* ignore */
    }
    return apiUrl;
  }

  const { hostname, protocol, origin } = window.location;

  // app.vantagedating.com — nginx proxies /socket.io on this host (see deploy/nginx-subdomains.conf)
  if (/^app\./i.test(hostname)) {
    return null;
  }

  if (apiUrl) {
    try {
      if (new URL(apiUrl).host === window.location.host) return null;
    } catch {
      /* ignore */
    }
    return apiUrl;
  }

  if (/^app\./i.test(hostname)) {
    return `${protocol}//api.${hostname.slice(4)}`;
  }

  return origin;
}

/** Shared Socket.IO client options for calls, chat, and presence. */
export function getSocketClientOptions(extra = {}) {
  const url = getSocketServerUrl();
  const isNative = Capacitor.isNativePlatform();

  const opts = {
    path: '/socket.io',
    // iOS WKWebView: start with polling, then upgrade (more reliable than websocket-first)
    transports: isNative ? ['polling', 'websocket'] : ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: isNative ? 15 : 10,
    timeout: isNative ? 30000 : 20000,
    autoConnect: true,
    ...extra,
  };

  if (
    url &&
    typeof window !== 'undefined' &&
    url.replace(/\/$/, '') !== window.location.origin.replace(/\/$/, '')
  ) {
    opts.withCredentials = true;
  }

  return opts;
}

/** Connect to the app Socket.IO server (same-origin in production when possible). */
export function connectAppSocket(extraOptions = {}) {
  const url = getSocketServerUrl();
  const opts = getSocketClientOptions(extraOptions);
  if (!url) return io(opts);
  return io(url, opts);
}
