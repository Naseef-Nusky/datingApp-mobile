/** App routes: main logged-in experience (full header nav) */
export const APP_ROUTES = ['/dashboard', '/profile', '/inbox', '/vip', '/compose-email'];

/** Registration wizard — hide full header nav (logo only) */
export const REGISTRATION_ROUTES = ['/register', '/complete-profile', '/signup-email'];

export function isAppRoute(pathname) {
  return APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isRegistrationRoute(pathname) {
  return REGISTRATION_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
