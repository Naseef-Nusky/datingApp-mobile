import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import Logo from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { buildSendLoginLinkPayload } from '../utils/sendLoginLinkPayload';
import { authorizeAppleSignIn } from '../utils/nativeAppleSignIn';
import { mobileApiUrl } from '../api/mobileApi';

/**
 * First registration page: email-based signup.
 * "Sign up to start meeting people!" – Continue with Google, or Your email + CONTINUE, or Continue with password.
 */
export default function SignupEmail() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { loginWithToken } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const showApple = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

  const handleContinueWithEmail = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError(t('auth.pleaseEnterEmail'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t('auth.pleaseEnterValidEmail'));
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/send-login-link', buildSendLoginLinkPayload(trimmed));
      navigate('/auth/check-email', {
        state: {
          email: trimmed,
          devLoginLink: res.data._devLoginLink,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || t('auth.failedSendLoginLink'));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      const { identityToken, givenName, familyName } = await authorizeAppleSignIn();
      const res = await axios.post('/api/auth/apple', {
        identityToken,
        givenName,
        familyName,
      });
      const { token, needsProfileCompletion, registrationComplete } = res.data;
      if (token && loginWithToken) {
        loginWithToken(token);
        if (needsProfileCompletion === true || registrationComplete === false) {
          navigate('/complete-profile', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Apple sign-in failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft cloud-style background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-24 bg-white rounded-full blur-2xl" />
        <div className="absolute top-40 right-20 w-56 h-32 bg-white rounded-full blur-2xl" />
        <div className="absolute bottom-32 left-1/4 w-48 h-28 bg-white rounded-full blur-2xl" />
      </div>

      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
        <div className="p-8 md:p-10">
          <div className="flex justify-center mb-6">
            <Logo className="h-11 w-auto object-contain" />
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-1">
            {t('pages.signup.title')}
          </h1>
          <p className="text-gray-500 text-sm text-center mb-6">
            {t('pages.signup.subtitle')}
          </p>

          {/* Continue with Google / Apple (Guideline 4.8) */}
          <div className="space-y-3 mb-4">
            <a
              href={mobileApiUrl('/api/auth/google')}
              className="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 text-gray-800 font-medium py-3.5 px-6 rounded-xl hover:bg-gray-50 transition no-underline"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t('pages.signup.continueWithGoogle')}
            </a>
            {showApple && (
              <button
                type="button"
                onClick={handleAppleSignUp}
                disabled={loading}
                className="flex items-center justify-center gap-3 w-full bg-black text-white font-medium py-3.5 px-6 rounded-xl hover:opacity-90 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.06 1.87-2.54 5.98.48 7.13-.57 1.48-1.31 2.96-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                {t('pages.login.signInWithApple')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">{t('pages.signup.or')}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email + CONTINUE */}
          <form onSubmit={handleContinueWithEmail} className="space-y-4">
            <input
              type="email"
              placeholder={t('pages.signup.yourEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none"
              disabled={loading}
            />
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-white uppercase text-sm tracking-wide disabled:opacity-50 transition"
              style={{
                background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
              }}
            >
              {loading ? t('pages.signup.sending') : t('pages.signup.continue')}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-600 text-sm">
            {t('pages.signup.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-vantage-purple font-medium hover:underline">
              {t('pages.signup.continueWithPassword')}
            </Link>
          </p>
        </div>

        {/* Terms */}
        <div className="px-6 pb-6 pt-0">
          <p className="text-gray-500 text-xs leading-relaxed text-center">
            {t('pages.signup.agreeTerms')}
          </p>
        </div>
      </div>
    </div>
  );
}
