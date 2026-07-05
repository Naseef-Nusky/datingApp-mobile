import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const APP_SCHEME = 'com.vantagedating.app';

/**
 * Fallback when Stripe lands on /stripe-return (https or legacy links).
 * Native: route to dashboard immediately. Browser: bounce to app via custom scheme.
 */
export default function StripeReturn() {
  const navigate = useNavigate();
  const params = window.location.search;

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate(`/dashboard${params}`, { replace: true });
      return;
    }

    const appUrl = `${APP_SCHEME}://dashboard${params}`;
    window.location.replace(appUrl);
  }, [navigate, params]);

  const isSuccess = new URLSearchParams(params).get('upgrade') === 'success'
    || new URLSearchParams(params).get('refill') === 'success';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #fdf2f8 100%)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '22rem',
          background: '#fff',
          borderRadius: '1rem',
          padding: '2rem 1.5rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{isSuccess ? '✓' : '…'}</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', marginBottom: '0.75rem' }}>
          {isSuccess ? 'Payment successful' : 'Returning to app'}
        </h1>
        <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Opening <strong>Vantage Dating</strong>…
        </p>
      </div>
    </div>
  );
}
