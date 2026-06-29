import { useAuth } from '../context/AuthContext';
import { useRefillModal } from '../context/RefillModalContext';
import { useUpgradeModal } from '../context/UpgradeModalContext';
import { hasActiveSubscription } from '../utils/subscription';
import { isInsufficientCreditsError } from '../utils/insufficientCredits';

/**
 * Opens upgrade modal when no active subscription, otherwise refill modal.
 */
export function useInsufficientCreditsHandler() {
  const { user } = useAuth();
  const { openRefillModal } = useRefillModal();
  const { openUpgradeModal } = useUpgradeModal();

  const handleInsufficientCredits = (refillOptions = {}) => {
    if (hasActiveSubscription(user)) {
      openRefillModal(refillOptions);
    } else {
      openUpgradeModal();
    }
  };

  const handleInsufficientCreditsError = (error, refillOptions = {}) => {
    if (!isInsufficientCreditsError(error)) return false;
    handleInsufficientCredits(refillOptions);
    return true;
  };

  /** API / socket payload: subscription required vs insufficient credits. */
  const handleCallAccessDenied = (payload = {}) => {
    const code = String(payload.code || '').toUpperCase();
    if (code === 'SUBSCRIPTION_REQUIRED') {
      openUpgradeModal();
      return true;
    }
    if (code === 'INSUFFICIENT_CREDITS') {
      openRefillModal({
        requiredCredits: payload.required ?? payload.costPerMinute,
        balance: payload.balance,
      });
      return true;
    }
    if (
      typeof payload.message === 'string' &&
      payload.message.toLowerCase().includes('insufficient')
    ) {
      handleInsufficientCredits({
        requiredCredits: payload.required ?? payload.costPerMinute,
        balance: payload.balance,
      });
      return true;
    }
    if (
      typeof payload.message === 'string' &&
      payload.message.toLowerCase().includes('upgrade')
    ) {
      openUpgradeModal();
      return true;
    }
    return false;
  };

  return {
    handleInsufficientCredits,
    handleInsufficientCreditsError,
    handleCallAccessDenied,
    isInsufficientCreditsError,
    hasActiveSubscription: () => hasActiveSubscription(user),
  };
}
