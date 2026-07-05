/** Main logged-in screens (full header nav) */
export const MOBILE_APP_ROUTES = ['/dashboard', '/profile', '/inbox', '/vip', '/compose-email'];

/** Registration wizard — header shows logo only */
export const REGISTRATION_ROUTES = ['/register', '/complete-profile', '/signup-email'];

/** Routes that show the app header when logged in */
export const MOBILE_HEADER_ROUTES = [...MOBILE_APP_ROUTES, ...REGISTRATION_ROUTES];

export function isAppRoute(pathname) {
  return MOBILE_APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isMobileAppRoute(pathname) {
  return isAppRoute(pathname);
}

export function isRegistrationRoute(pathname) {
  return REGISTRATION_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isMobileHeaderRoute(pathname) {
  return MOBILE_HEADER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** @deprecated use MOBILE_APP_ROUTES */
export const APP_ROUTES = MOBILE_APP_ROUTES;
