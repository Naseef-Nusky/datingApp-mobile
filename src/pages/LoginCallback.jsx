import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const apiBase = () => (import.meta.env.VITE_API_URL || axios.defaults.baseURL || '').replace(/\/$/, '');

const verifyLoginLink = (token) => {
  const base = apiBase();
  const url = base ? `${base}/api/auth/verify-login-link` : '/api/auth/verify-login-link';
  return axios.post(url, { token }, { timeout: 20000 });
};

/**
 * Handles magic link click from email: ?token=xxx → verify with API, store token, redirect.
 */
export default function LoginCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { t } = useLanguage();
  /** loading | invalid */
  const [status, setStatus] = useState('loading');
  const [errorDetail, setErrorDetail] = useState('');

  const token = (searchParams.get('token') || '').trim();

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorDetail('missing_token');
      return;
    }

    let cancelled = false;

    const runVerify = async (attempt = 0) => {
      try {
        const res = await verifyLoginLink(token);
        if (cancelled) return;

        const {
          token: jwt,
          user: userData,
          registrationComplete,
          needsProfileCompletion,
        } = res.data;

        if (!jwt || !userData) {
          setStatus('invalid');
          setErrorDetail('invalid_response');
          return;
        }

        loginWithToken(jwt, userData);

        const target =
          needsProfileCompletion === true || registrationComplete === false
            ? '/complete-profile'
            : '/dashboard';

        navigate(target, { replace: true });
      } catch (err) {
        if (cancelled) return;
        if (attempt < 1) {
          setTimeout(() => runVerify(attempt + 1), 400);
          return;
        }
        const msg =
          err.response?.data?.message ||
          (err.code === 'ECONNABORTED' ? 'Request timed out' : null) ||
          (err.message === 'Network Error' ? 'Cannot reach API server' : null) ||
          err.message ||
          'verify_failed';
        setErrorDetail(msg);
        setStatus('invalid');
      }
    };

    runVerify();

    return () => {
      cancelled = true;
    };
  }, [token, loginWithToken, navigate]);

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('loginCallback.invalidLink')}</h1>
          <p className="text-gray-600 text-sm mb-6">
            {t('loginCallback.invalidLinkDescription')}
          </p>
          {errorDetail && errorDetail !== 'missing_token' && (
            <p className="text-gray-500 text-xs mb-4 break-words">{errorDetail}</p>
          )}
          <a
            href="/signup-email"
            className="inline-block py-3 px-6 rounded-xl font-semibold text-white"
            style={{
              background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
            }}
          >
            {t('loginCallback.getNewLink')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">{t('loginCallback.loggingYouIn')}</p>
    </div>
  );
}
