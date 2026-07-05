import { useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRefillModal } from '../context/CreditsModalsProvider';
import { useUpgradeModal } from '../context/CreditsModalsProvider';
import { hasActiveSubscription } from '../utils/subscription';
import { useInsufficientCreditsHandler } from './useInsufficientCreditsHandler';

function isWaivedUser(user) {
  return user?.userType === 'streamer' || user?.userType === 'talent';
}

/**
 * Pre-flight credit/subscription checks — mirrors web Profile.jsx + direct modal open.
 */
export function useServiceAccess() {
  const { user } = useAuth();
  const { openRefillModal } = useRefillModal();
  const { openUpgradeModal } = useUpgradeModal();
  const { handleInsufficientCreditsError, handleCallAccessDenied } = useInsufficientCreditsHandler();

  const showUpgradeRequired = useCallback(() => {
    openUpgradeModal();
    return false;
  }, [openUpgradeModal]);

  const showRefillOrUpgrade = useCallback(
    (options = {}) => {
      if (hasActiveSubscription(user)) {
        openRefillModal(options);
      } else {
        openUpgradeModal();
      }
      return false;
    },
    [openRefillModal, openUpgradeModal, user],
  );

  const resolveAccessPayload = useCallback(
    (data) => {
      if (data?.allowed === true) return true;

      const code = String(data?.code || '').toUpperCase();
      if (code === 'SUBSCRIPTION_REQUIRED') return showUpgradeRequired();
      if (code === 'INSUFFICIENT_CREDITS') {
        return showRefillOrUpgrade({
          requiredCredits:
            data.required ?? data.costPerMinute ?? data.costPerMessage ?? data.emailCost ?? data.mingleCost,
          balance: data.balance,
        });
      }

      if (handleCallAccessDenied(data || {})) return false;

      if (
        typeof data?.message === 'string' &&
        data.message.toLowerCase().includes('upgrade')
      ) {
        return showUpgradeRequired();
      }
      if (
        typeof data?.message === 'string' &&
        data.message.toLowerCase().includes('insufficient')
      ) {
        return showRefillOrUpgrade({
          requiredCredits: data.required,
          balance: data.balance,
        });
      }

      if (data?.message) alert(data.message);
      else alert('This action is not available right now.');
      return false;
    },
    [handleCallAccessDenied, showRefillOrUpgrade, showUpgradeRequired],
  );

  const ensureServiceAccess = useCallback(
    async (url, params, { requireSubscription = true } = {}) => {
      if (!isWaivedUser(user) && requireSubscription && !hasActiveSubscription(user)) {
        return showUpgradeRequired();
      }

      try {
        const { data } = await axios.get(url, { params });
        return resolveAccessPayload(data);
      } catch (error) {
        if (handleInsufficientCreditsError(error)) return false;
        const payload = error.response?.data;
        if (payload && handleCallAccessDenied(payload)) return false;
        if (!isWaivedUser(user) && requireSubscription && !hasActiveSubscription(user)) {
          return showUpgradeRequired();
        }
        alert(payload?.message || 'This action is not available right now.');
        return false;
      }
    },
    [
      user,
      resolveAccessPayload,
      handleInsufficientCreditsError,
      handleCallAccessDenied,
      showUpgradeRequired,
    ],
  );

  const ensureCanOpenChat = useCallback(
    () => ensureServiceAccess('/api/credits/chat-access'),
    [ensureServiceAccess],
  );

  const ensureCanSendEmailAccess = useCallback(
    () => ensureServiceAccess('/api/credits/email-access'),
    [ensureServiceAccess],
  );

  const ensureCanStartCall = useCallback(
    (callType) => ensureServiceAccess('/api/credits/call-access', { callType }),
    [ensureServiceAccess],
  );

  const ensureCanSendMingle = useCallback(
    () => ensureServiceAccess('/api/credits/mingle-access'),
    [ensureServiceAccess],
  );

  const ensureCanAffordCredits = useCallback(
    async (requiredCredits) => {
      const required = Number(requiredCredits) || 0;
      if (required <= 0 || isWaivedUser(user)) return true;

      if (!hasActiveSubscription(user)) return showUpgradeRequired();

      try {
        const { data } = await axios.get('/api/credits/balance');
        const balance = Number(data?.credits) || 0;
        if (balance >= required) return true;
        return showRefillOrUpgrade({ requiredCredits: required, balance });
      } catch (error) {
        if (handleInsufficientCreditsError(error, { requiredCredits: required })) return false;
        const balance = Number(user?.credits) || 0;
        if (balance >= required) return true;
        return showRefillOrUpgrade({ requiredCredits: required, balance });
      }
    },
    [user, showRefillOrUpgrade, showUpgradeRequired, handleInsufficientCreditsError],
  );

  const ensureCanUnlockAttachment = useCallback(
    async (attachmentType) => {
      try {
        const { data } = await axios.get('/api/credits/service-costs');
        const cost =
          attachmentType === 'voice'
            ? Number(data?.voiceMessageCredits) || 0
            : attachmentType === 'video'
              ? Number(data?.videoViewCredits ?? data?.photoViewCredits) || 0
              : Number(data?.photoViewCredits) || 0;
        return ensureCanAffordCredits(cost);
      } catch (error) {
        if (handleInsufficientCreditsError(error)) return false;
        alert('Could not verify unlock cost.');
        return false;
      }
    },
    [ensureCanAffordCredits, handleInsufficientCreditsError],
  );

  return {
    ensureServiceAccess,
    ensureCanOpenChat,
    ensureCanSendEmailAccess,
    ensureCanStartCall,
    ensureCanSendMingle,
    ensureCanAffordCredits,
    ensureCanUnlockAttachment,
    showUpgradeRequired,
    showRefillOrUpgrade,
  };
}
