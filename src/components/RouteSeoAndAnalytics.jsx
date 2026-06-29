import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';
import { applyRouteSeo } from '../utils/seo';

/**
 * SPA: send GA4 page_view on route change; sync title, canonical, og:url.
 */
export default function RouteSeoAndAnalytics() {
  const location = useLocation();

  useEffect(() => {
    applyRouteSeo(location.pathname);
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}
