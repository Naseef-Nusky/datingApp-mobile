import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../app/ProtectedRoute';
import MobileWelcome from '../mobile/pages/MobileWelcome';
import Login from '../pages/Login';
import Register from '../pages/Register';
import SignupEmail from '../pages/SignupEmail';
import CheckEmail from '../pages/CheckEmail';
import LoginCallback from '../pages/LoginCallback';
import GoogleCallback from '../pages/GoogleCallback';
import CompleteProfile from '../pages/CompleteProfile';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import MyProfile from '../pages/MyProfile';
import Inbox from '../pages/Inbox';
import VipPage from '../pages/VipPage';
import ComposeEmail from '../pages/ComposeEmail';
import StripeReturn from '../pages/StripeReturn';
import HelpCenter from '../pages/HelpCenter';
import TermsOfUseModal from '../components/TermsOfUseModal';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import RefundPolicyModal from '../components/RefundPolicyModal';
import SafetyPolicyModal from '../components/SafetyPolicyModal';
import AboutModal from '../components/AboutModal';

/**
 * Mobile-only route table — no SEO landing pages (mature/asian/gay/singles marketing).
 * Add new mobile screens under src/mobile/ and register them here.
 */
export default function MobileAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MobileWelcome />} />
      <Route path="/login" element={<Login />} />
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

      {/* Stripe post-payment bridge (https fallback — auto-opens native app) */}
      <Route path="/stripe-return" element={<StripeReturn />} />

      <Route path="/help" element={<HelpCenter />} />
      <Route path="/terms" element={<TermsOfUseModal asPage />} />
      <Route path="/privacy" element={<PrivacyPolicyModal asPage />} />
      <Route path="/refund" element={<RefundPolicyModal asPage />} />
      <Route path="/safety" element={<SafetyPolicyModal asPage />} />
      <Route path="/about" element={<AboutModal asPage />} />

      <Route path="/contact" element={<Navigate to="/help" replace />} />
      <Route path="/online-dating-advice" element={<Navigate to="/help" replace />} />
      <Route path="/mature-online-dating" element={<Navigate to="/" replace />} />
      <Route path="/asian-online-dating" element={<Navigate to="/" replace />} />
      <Route path="/gay-online-dating" element={<Navigate to="/" replace />} />
      <Route path="/online-dating-singles" element={<Navigate to="/" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
