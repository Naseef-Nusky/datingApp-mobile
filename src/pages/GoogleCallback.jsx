import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Handles redirect from backend after Google OAuth:
 * - If token present: apply token, wait for user, then navigate to dashboard (legacy/direct login).
 * - If email + login_link_sent: backend sent a login link to email; show "Check your email" and offer link to home page.
 */
export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, loginWithToken } = useAuth();
  const [status, setStatus] = useState('loading');
  const tokenApplied = useRef(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const loginLinkSent = searchParams.get('login_link_sent') === '1';

  // Case: backend sent login link (no token) — show "check your email"
  if (!token && email && loginLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-600 text-sm mb-3">
            We sent a login link to <strong>{email}</strong>. Click the link in that email to sign in.
          </p>
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-left leading-relaxed">
            Can&apos;t find it? Check Junk or Spam (Outlook and iCloud often filter sign-in mail). Mark as Not junk, then open the link.
          </p>
          <a
            href="/"
            className="inline-block py-3 px-6 rounded-xl font-semibold text-white"
            style={{
              background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
            }}
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  // 1) Apply token from URL once
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    if (tokenApplied.current) return;
    tokenApplied.current = true;
    if (loginWithToken) {
      loginWithToken(token);
    } else {
      setStatus('error');
    }
  }, [searchParams, loginWithToken]);

  // 2) After token is applied, wait for user to be loaded then navigate
  useEffect(() => {
    if (!tokenApplied.current || status === 'error') return;
    const token = searchParams.get('token');
    if (!token) return;

    if (user) {
      const to = searchParams.get('to') || '/dashboard';
      const openCompleteProfile = searchParams.get('openCompleteProfile') === '1';
      setStatus('success');
      navigate(to, {
        replace: true,
        state: openCompleteProfile ? { openCompleteProfile: true } : undefined,
      });
      return;
    }

    // If loading finished but no user, token may be invalid or fetch failed
    if (!loading) {
      setStatus('error');
    }
  }, [user, loading, status, searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Signing you in...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sign-in failed</h1>
          <p className="text-gray-600 text-sm mb-6">Something went wrong. Please try again.</p>
          <a
            href="/"
            className="inline-block py-3 px-6 rounded-xl font-semibold text-white"
            style={{
              background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
            }}
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return null;
}
