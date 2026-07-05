import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translatePage } from '../utils/translatePage';
import { isMobileHeaderRoute, isRegistrationRoute } from '../utils/routePaths';
import Header from '../components/Header';
import InactivityModal from '../components/InactivityModal';
import IncomingCallManager from '../components/IncomingCallManager';
import { useInactivity } from '../hooks/useInactivity';
import useStripePaymentReturn from '../hooks/useStripePaymentReturn';
import StripePendingBanner from '../components/StripePendingBanner';
import CreditsBalanceSync from '../components/CreditsBalanceSync';
import ScrollToTop from './ScrollToTop';
import MobileAppRoutes from '../routes/mobileRoutes';

export default function MobileAppShell() {
  const location = useLocation();
  const { user } = useAuth();
  const { confirmPendingManually } = useStripePaymentReturn();

  useEffect(() => {
    const lang = localStorage.getItem('app_language') || localStorage.getItem('selectedLanguage') || 'en';
    if (lang === 'en' || lang === 'en-uk') return;
    const t1 = setTimeout(() => translatePage(lang), 300);
    const t2 = setTimeout(() => translatePage(lang), 1200);
    const t3 = setTimeout(() => translatePage(lang), 2800);
    const t4 = setTimeout(() => translatePage(lang), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [location.pathname, user?.id]);

  const onRegistrationWizard = isRegistrationRoute(location.pathname);
  const showHeader = user && isMobileHeaderRoute(location.pathname);
  const showFullHeaderNav = showHeader && !onRegistrationWizard;
  const [showInactivityModal, resetInactivity] = useInactivity(showFullHeaderNav);

  return (
    <div className="min-h-app-screen bg-gray-50 flex flex-col">
      <ScrollToTop />
      {showHeader && <Header />}
      {user && <IncomingCallManager />}
      {user && <CreditsBalanceSync />}
      {showInactivityModal && (
        <InactivityModal onContinue={resetInactivity} />
      )}
      <div className="flex-1">
        <MobileAppRoutes />
      </div>
      {user && (
        <StripePendingBanner
          onConfirmPending={(pending) => {
            confirmPendingManually(pending);
          }}
        />
      )}
    </div>
  );
}
