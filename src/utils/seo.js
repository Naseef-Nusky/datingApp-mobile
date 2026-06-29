const SITE_NAME = 'Vantage Dating';

/** Short titles for common routes (SEO + browser tab). */
const ROUTE_TITLES = {
  '/': `${SITE_NAME} – Meet singles worldwide`,
  '/login': `Login – ${SITE_NAME}`,
  '/register': `Sign up – ${SITE_NAME}`,
  '/signup-email': `Sign up – ${SITE_NAME}`,
  '/contact': `Contact – ${SITE_NAME}`,
  '/help': `Help center – ${SITE_NAME}`,
  '/online-dating-advice': `Dating advice – ${SITE_NAME}`,
  '/dashboard': `Dashboard – ${SITE_NAME}`,
  '/inbox': `Messages – ${SITE_NAME}`,
  '/vip': `VIP – ${SITE_NAME}`,
  '/complete-profile': `Complete profile – ${SITE_NAME}`,
  '/mature-online-dating': `Mature online dating – ${SITE_NAME}`,
  '/asian-online-dating': `Asian online dating – ${SITE_NAME}`,
  '/gay-online-dating': `Gay online dating – ${SITE_NAME}`,
  '/online-dating-singles': `Singles online dating – ${SITE_NAME}`,
};

function titleForPath(pathname) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith('/profile/')) return `Profile – ${SITE_NAME}`;
  return `${SITE_NAME}`;
}

/**
 * One-time JSON-LD when VITE_SITE_URL is set.
 */
export function injectJsonLdWebsite() {
  const site = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');
  if (!site || typeof document === 'undefined') return;
  const existing = document.getElementById('jsonld-website');
  if (existing) return;
  const script = document.createElement('script');
  script.id = 'jsonld-website';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: site,
  });
  document.head.appendChild(script);
}

/**
 * Updates document title, canonical, and Open Graph URL for the current route.
 */
export function applyRouteSeo(pathname) {
  document.title = titleForPath(pathname);

  const site = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');
  if (!site) return;

  const url = `${site}${pathname || '/'}`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', url);

  const twUrl = document.querySelector('meta[name="twitter:url"]');
  if (twUrl) twUrl.setAttribute('content', url);

  const imageBase = (import.meta.env.VITE_OG_IMAGE_URL || '').trim();
  const imageAbs =
    imageBase && imageBase.startsWith('http')
      ? imageBase
      : `${site}${imageBase || '/og-image.png'}`;
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg) ogImg.setAttribute('content', imageAbs);
  const twImg = document.querySelector('meta[name="twitter:image"]');
  if (twImg) twImg.setAttribute('content', imageAbs);
}
