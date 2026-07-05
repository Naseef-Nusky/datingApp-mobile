import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './AuthContext';
import CreditPackModal from '../components/CreditPackModal';
import UpgradeSubscriptionModal from '../components/UpgradeSubscriptionModal';

const RefillModalContext = createContext(null);
const UpgradeModalContext = createContext(null);

/**
 * Single provider for Refill + Upgrade modals, portaled to document.body
 * so they always appear above chat/email overlays on iOS/Android.
 */
export function CreditsModalsProvider({ children }) {
  const { refreshCreditBalance } = useAuth();
  const [refillOpen, setRefillOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [refillOptions, setRefillOptions] = useState({});

  const openRefillModal = useCallback((options = {}) => {
    setUpgradeOpen(false);
    setRefillOptions(options || {});
    setRefillOpen(true);
  }, []);

  const closeRefillModal = useCallback(() => {
    setRefillOpen(false);
    setRefillOptions({});
  }, []);

  const openUpgradeModal = useCallback(() => {
    setRefillOpen(false);
    setUpgradeOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeOpen(false);
  }, []);

  const modalLayer =
    typeof document !== 'undefined'
      ? createPortal(
          <>
            <CreditPackModal
              isOpen={refillOpen}
              onClose={closeRefillModal}
              onCreditsAdded={refreshCreditBalance}
              requiredCredits={refillOptions.requiredCredits}
              returnPath={refillOptions.returnPath}
            />
            <UpgradeSubscriptionModal
              isOpen={upgradeOpen}
              onClose={closeUpgradeModal}
              onSubscribed={refreshCreditBalance}
            />
          </>,
          document.body,
        )
      : null;

  return (
    <RefillModalContext.Provider value={{ openRefillModal, closeRefillModal }}>
      <UpgradeModalContext.Provider value={{ openUpgradeModal, closeUpgradeModal }}>
        {children}
        {modalLayer}
      </UpgradeModalContext.Provider>
    </RefillModalContext.Provider>
  );
}

export function useRefillModal() {
  const ctx = useContext(RefillModalContext);
  if (!ctx) {
    throw new Error('useRefillModal must be used within CreditsModalsProvider');
  }
  return ctx;
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) {
    throw new Error('useUpgradeModal must be used within CreditsModalsProvider');
  }
  return ctx;
}
