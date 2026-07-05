import { useCallback, useEffect, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';

/**
 * Live credit balance for UI (profile, presents, etc.).
 * Refreshes on mount and app resume — does NOT re-fetch on credits-updated
 * (that event only syncs local state to avoid an infinite refresh loop).
 */
export default function useCreditBalance({ refreshOnMount = true } = {}) {
  const { user, refreshCreditBalance } = useAuth();
  const [credits, setCredits] = useState(() => Number(user?.credits) || 0);
  const [loading, setLoading] = useState(false);
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return null;
    refreshingRef.current = true;
    setLoading(true);
    try {
      const balance = await refreshCreditBalance();
      if (balance != null) setCredits(balance);
      return balance;
    } finally {
      refreshingRef.current = false;
      setLoading(false);
    }
  }, [refreshCreditBalance]);

  useEffect(() => {
    setCredits(Number(user?.credits) || 0);
  }, [user?.credits]);

  useEffect(() => {
    if (!refreshOnMount) return;
    refresh();
  }, [refresh, refreshOnMount]);

  useEffect(() => {
    const onCreditsUpdated = (event) => {
      const next = Number(event?.detail?.credits);
      if (!Number.isNaN(next)) setCredits(next);
    };
    window.addEventListener('credits-updated', onCreditsUpdated);
    return () => window.removeEventListener('credits-updated', onCreditsUpdated);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let cancelled = false;
    let handle = null;
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && !cancelled) refresh();
    }).then((h) => {
      handle = h;
    });
    return () => {
      cancelled = true;
      handle?.remove?.();
    };
  }, [refresh]);

  return { credits, loading, refreshCredits: refresh };
}
