import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LandingHero from '../../components/LandingHero';

/** Mobile app entry — hero + login/signup (no web marketing pages). */
export default function MobileWelcome() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-app-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">{t('pages.loading')}</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingHero />;
}
