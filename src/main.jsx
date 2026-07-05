import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App.jsx';
import './index.css';
import { initMagicLinkDeepLinks } from './utils/magicLinkDeepLink.js';
import { initGoogleAnalytics } from './utils/analytics.js';
import { injectJsonLdWebsite } from './utils/seo.js';
import { toMobileApiUrl } from './api/mobileApi.js';
import { processApiCreditsPayload } from './utils/creditSync.js';
import { isCreditsAccessDenied, wasCreditsAccessHandled } from './utils/creditsAccess.js';

// Baked in at build time from .env.production (VITE_API_URL).
const raw = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = raw.replace(/\/$/, '');

// All /api/* requests → /api/mobile/* (mobile-only backend routes)
axios.interceptors.request.use((config) => {
  if (config.url) {
    config.url = toMobileApiUrl(config.url);
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    if (response?.data) {
      processApiCreditsPayload(response.data);
    }
    return response;
  },
  (err) => {
    const status = err.response?.status;
    const payload = err.response?.data;
    if (
      !wasCreditsAccessHandled(err) &&
      isCreditsAccessDenied(payload, status)
    ) {
      window.dispatchEvent(
        new CustomEvent('credits-access-denied', { detail: payload }),
      );
    }
    if (err.response?.status === 503 && err.response?.data?.code === 'MAINTENANCE') {
      const d = err.response.data || {};
      window.dispatchEvent(
        new CustomEvent('app-maintenance', {
          detail: {
            message: d.message,
            maintenanceMessage: d.maintenanceMessage,
          },
        })
      );
    }
    return Promise.reject(err);
  }
);

if (Capacitor.isNativePlatform() && !axios.defaults.baseURL) {
  console.error(
    '[Vantage Dating] Native app: VITE_API_URL is empty. Set it in .env.production (e.g. https://api.yourdomain.com or http://YOUR_MAC_IP:5000 for simulator), then run: npm run cap:sync',
  );
}

if (import.meta.env.PROD && !raw && typeof window !== 'undefined' && /^app\./.test(window.location.hostname)) {
  const apiHost = window.location.hostname.replace(/^app\./, 'api.');
  console.warn(
    `[Vantage Dating] Set VITE_API_URL=https://${apiHost} in frontend/.env.production and rebuild, or raise client_max_body_size on this nginx server for /api.`,
  );
}

initGoogleAnalytics();
injectJsonLdWebsite();

// Native iOS/Android shell (Capacitor)
if (Capacitor.isNativePlatform()) {
  console.info('[Vantage Dating Mobile] API base URL:', axios.defaults.baseURL || '(empty)');
  console.info('[Vantage Dating Mobile] API prefix: /api/mobile');
  void initMagicLinkDeepLinks();
  if (Capacitor.getPlatform() === 'ios') {
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  } else {
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#0066cc' }).catch(() => {});
  }
  SplashScreen.hide().catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);













