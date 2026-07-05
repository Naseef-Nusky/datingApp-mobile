import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { processApiCreditsPayload } from '../utils/creditSync';

const CALL_CREDIT_SETTLE_MS = 700;

/**
 * Sync credits after a paid action — same approach as web (fetchUser from /api/auth/me),
 * plus authoritative balance from /api/credits/balance.
 */
export function useCreditsSync() {
  const { user, fetchUser, refreshCreditBalance } = useAuth();

  const syncCreditsNow = useCallback(async () => {
    await fetchUser();
    await refreshCreditBalance();
  }, [fetchUser, refreshCreditBalance]);

  const syncCreditsAfterAction = useCallback(
    async (responseData) => {
      if (responseData) {
        processApiCreditsPayload(responseData);
      }
      await syncCreditsNow();
    },
    [syncCreditsNow],
  );

  /** Calls deduct credits on the server after call-end socket — wait briefly then refresh. */
  const syncCreditsAfterCall = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, CALL_CREDIT_SETTLE_MS));
    await syncCreditsNow();
  }, [syncCreditsNow]);

  return {
    syncCreditsAfterAction,
    syncCreditsAfterCall,
    syncCreditsNow,
    userCredits: Number(user?.credits) || 0,
  };
}
