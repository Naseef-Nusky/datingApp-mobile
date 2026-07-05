/** Mobile app uses /api/mobile/* instead of /api/* (web). */
export const MOBILE_API_PREFIX = '/api/mobile';

/**
 * Rewrite a web API path to the mobile API prefix.
 * @param {string} path - e.g. '/api/auth/me' or '/api/mobile/auth/me'
 */
export function toMobileApiPath(path) {
  if (!path || typeof path !== 'string') return path;
  if (path.startsWith(MOBILE_API_PREFIX)) return path;
  if (path.startsWith('/api/')) {
    return path.replace(/^\/api\//, `${MOBILE_API_PREFIX}/`);
  }
  return `${MOBILE_API_PREFIX}/${path.replace(/^\//, '')}`;
}

/**
 * Rewrite full or relative axios/fetch URL to mobile API routes.
 */
export function toMobileApiUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes(`${MOBILE_API_PREFIX}/`)) return url;
  return url.replace(/\/api\//g, `${MOBILE_API_PREFIX}/`);
}

/** Absolute URL for browser redirects (e.g. Google OAuth). */
export function mobileApiUrl(path) {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const mobilePath = toMobileApiPath(path.startsWith('/') ? path : `/api/${path}`);
  return base ? `${base}${mobilePath}` : mobilePath;
}
