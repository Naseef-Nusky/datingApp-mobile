import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import MaintenanceScreen from './components/MaintenanceScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { RefillModalProvider } from './context/RefillModalContext';
import { UpgradeModalProvider } from './context/UpgradeModalContext';
import { LanguageProvider } from './context/LanguageContext';
import { translatePage } from './utils/translatePage';
import Header from './components/Header';
import SiteFooter from './components/SiteFooter';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SignupEmail from './pages/SignupEmail';
import CheckEmail from './pages/CheckEmail';
import LoginCallback from './pages/LoginCallback';
import GoogleCallback from './pages/GoogleCallback';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyProfile from './pages/MyProfile';
import Inbox from './pages/Inbox';
import VipPage from './pages/VipPage';
import ComposeEmail from './pages/ComposeEmail';
import MatureOnlineDating from './pages/MatureOnlineDating';
import AsianOnlineDating from './pages/AsianOnlineDating';
import GayDatingOnline from './pages/GayDatingOnline';
import SinglesOnlineDating from './pages/SinglesOnlineDating';
import CompleteProfile from './pages/CompleteProfile';
import TermsOfUseModal from './components/TermsOfUseModal';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import RefundPolicyModal from './components/RefundPolicyModal';
import SafetyPolicyModal from './components/SafetyPolicyModal';
import AboutModal from './components/AboutModal';
import InactivityModal from './components/InactivityModal';
import IncomingCallManager from './components/IncomingCallManager';
import { useInactivity } from './hooks/useInactivity';
import Contact from './pages/Contact';
import HelpCenter from './pages/HelpCenter';
import OnlineDatingAdvice from './pages/OnlineDatingAdvice';
import RouteSeoAndAnalytics from './components/RouteSeoAndAnalytics';
import { isAppRoute, isRegistrationRoute } from './utils/routePaths';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('pages.loading')}</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/" />;
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell() {
  const location = useLocation();
  const { user } = useAuth();

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
  const showHeader =
    user && (isAppRoute(location.pathname) || onRegistrationWizard);
  const showFullHeaderNav = showHeader && !onRegistrationWizard;
  const isIosNativeShell = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  const showFooter = !showHeader && !isIosNativeShell && !onRegistrationWizard;
  const [showInactivityModal, resetInactivity] = useInactivity(showFullHeaderNav);

  return (
    <div className="min-h-app-screen bg-gray-50 flex flex-col">
      <ScrollToTop />
      <RouteSeoAndAnalytics />
      {showHeader && <Header />}
      {user && <IncomingCallManager />}
      {showInactivityModal && (
        <InactivityModal onContinue={resetInactivity} />
      )}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/terms" element={<TermsOfUseModal asPage />} />
          <Route path="/privacy" element={<PrivacyPolicyModal asPage />} />
          <Route path="/refund" element={<RefundPolicyModal asPage />} />
          <Route path="/safety" element={<SafetyPolicyModal asPage />} />
          <Route path="/about" element={<AboutModal asPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/online-dating-advice" element={<OnlineDatingAdvice />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup-email" element={<SignupEmail />} />
          <Route path="/auth/check-email" element={<CheckEmail />} />
          <Route path="/auth/login-callback" element={<LoginCallback />} />
          <Route path="/auth/google-callback" element={<GoogleCallback />} />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/me"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vip"
            element={
              <ProtectedRoute>
                <VipPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compose-email"
            element={
              <ProtectedRoute>
                <ComposeEmail />
              </ProtectedRoute>
            }
          />
          <Route path="/mature-online-dating" element={<MatureOnlineDating />} />
          <Route path="/asian-online-dating" element={<AsianOnlineDating />} />
          <Route path="/gay-online-dating" element={<GayDatingOnline />} />
          <Route path="/online-dating-singles" element={<SinglesOnlineDating />} />
        </Routes>
      </div>
      {showFooter && <SiteFooter />}
    </div>
  );
}

function App() {
  const [maintGate, setMaintGate] = useState({
    loading: true,
    blocked: false,
    siteName: 'Vantage Dating',
    message: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/auth/site-status', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (cancelled) return;
        if (data.appInMaintenance) {
          setMaintGate({
            loading: false,
            blocked: true,
            siteName: data.siteName || 'Vantage Dating',
            message: data.maintenanceMessage || '',
          });
        } else {
          setMaintGate((s) => ({ ...s, loading: false, blocked: false }));
        }
      } catch {
        if (!cancelled) {
          setMaintGate((s) => ({ ...s, loading: false, blocked: false }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMaint = (e) => {
      const d = e.detail || {};
      setMaintGate({
        loading: false,
        blocked: true,
        siteName: d.siteName || 'Vantage Dating',
        message: d.message || d.maintenanceMessage || '',
      });
    };
    window.addEventListener('app-maintenance', onMaint);
    return () => window.removeEventListener('app-maintenance', onMaint);
  }, []);

  // Fix iOS/Capacitor layout where `100vh` can be wrong when browser chrome collapses.
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  if (maintGate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading…
      </div>
    );
  }

  if (maintGate.blocked) {
    return <MaintenanceScreen siteName={maintGate.siteName} message={maintGate.message} />;
  }

  return (
    <AuthProvider>
      <RefillModalProvider>
        <UpgradeModalProvider>
        <LanguageProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppShell />
        </Router>
        </LanguageProvider>
        </UpgradeModalProvider>
      </RefillModalProvider>
    </AuthProvider>
  );
}

export default App

