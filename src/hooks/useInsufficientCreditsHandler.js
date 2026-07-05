import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRefillModal } from '../context/CreditsModalsProvider';
import { useUpgradeModal } from '../context/CreditsModalsProvider';
import { hasActiveSubscription } from '../utils/subscription';
import { isInsufficientCreditsError } from '../utils/insufficientCredits';
import { isCreditsAccessDenied, markCreditsAccessHandled } from '../utils/creditsAccess';

/**
 * Opens upgrade modal when no active subscription, otherwise refill modal.
 */
export function useInsufficientCreditsHandler() {
  const { user } = useAuth();
  const { openRefillModal } = useRefillModal();
  const { openUpgradeModal } = useUpgradeModal();

  const handleInsufficientCredits = useCallback((refillOptions = {}) => {
    if (hasActiveSubscription(user)) {
      openRefillModal(refillOptions);
    } else {
      openUpgradeModal();
    }
  }, [openRefillModal, openUpgradeModal, user]);

  const openCreditsAccessModal = useCallback((payload = {}, refillOptions = {}) => {
    const code = String(payload.code || '').toUpperCase();
    if (code === 'SUBSCRIPTION_REQUIRED') {
      openUpgradeModal();
      return true;
    }
    if (code === 'INSUFFICIENT_CREDITS') {
      handleInsufficientCredits({
        requiredCredits:
          refillOptions.requiredCredits ??
          payload.required ??
          payload.costPerMinute ??
          payload.costPerMessage ??
          payload.emailCost ??
          payload.mingleCost,
        balance: refillOptions.balance ?? payload.balance,
        returnPath: refillOptions.returnPath,
      });
      return true;
    }
    if (
      typeof payload.message === 'string' &&
      payload.message.toLowerCase().includes('insufficient')
    ) {
      handleInsufficientCredits({
        requiredCredits:
          refillOptions.requiredCredits ??
          payload.required ??
          payload.costPerMinute ??
          payload.costPerMessage ??
          payload.emailCost,
        balance: refillOptions.balance ?? payload.balance,
        returnPath: refillOptions.returnPath,
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
  }, [handleInsufficientCredits, openUpgradeModal]);

  const handleCallAccessDenied = useCallback((payload = {}, refillOptions = {}) => {
    return openCreditsAccessModal(payload, refillOptions);
  }, [openCreditsAccessModal]);

  const handleInsufficientCreditsError = useCallback((error, refillOptions = {}) => {
    const payload = error?.response?.data;
    if (payload && openCreditsAccessModal(payload, refillOptions)) {
      markCreditsAccessHandled(error);
      return true;
    }
    if (!isInsufficientCreditsError(error) && !isCreditsAccessDenied(payload, error?.response?.status)) {
      return false;
    }
    handleInsufficientCredits({
      ...refillOptions,
      requiredCredits:
        refillOptions.requiredCredits ??
        payload?.required ??
        payload?.costPerMessage ??
        payload?.emailCost ??
        payload?.costPerMinute ??
        payload?.mingleCost,
      balance: refillOptions.balance ?? payload?.balance,
    });
    markCreditsAccessHandled(error);
    return true;
  }, [handleInsufficientCredits, openCreditsAccessModal]);

  return {
    handleInsufficientCredits,
    handleInsufficientCreditsError,
    handleCallAccessDenied,
    isInsufficientCreditsError,
    hasActiveSubscription: () => hasActiveSubscription(user),
  };
}
