import { useEffect, useRef } from 'react';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';

/**
 * Global fallback: opens Refill/Upgrade when any API returns insufficient credits
 * or subscription required (safety net when a screen forgets a local handler).
 */
export default function CreditsAccessBridge() {
  const { handleCallAccessDenied } = useInsufficientCreditsHandler();
  const lastKeyRef = useRef('');
  const lastAtRef = useRef(0);

  useEffect(() => {
    const onDenied = (event) => {
      const payload = event?.detail;
      if (!payload || typeof payload !== 'object') return;

      const key = `${payload.code || ''}:${payload.required ?? ''}:${payload.message || ''}`;
      const now = Date.now();
      if (key === lastKeyRef.current && now - lastAtRef.current < 1200) return;
      lastKeyRef.current = key;
      lastAtRef.current = now;

      handleCallAccessDenied(payload);
    };

    window.addEventListener('credits-access-denied', onDenied);
    return () => window.removeEventListener('credits-access-denied', onDenied);
  }, [handleCallAccessDenied]);

  return null;
}
