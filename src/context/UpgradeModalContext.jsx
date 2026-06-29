import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import UpgradeSubscriptionModal from '../components/UpgradeSubscriptionModal';

const UpgradeModalContext = createContext(null);

export function UpgradeModalProvider({ children }) {
  const { fetchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const openUpgradeModal = () => setIsOpen(true);
  const closeUpgradeModal = () => setIsOpen(false);

  return (
    <UpgradeModalContext.Provider value={{ openUpgradeModal, closeUpgradeModal }}>
      {children}
      <UpgradeSubscriptionModal
        isOpen={isOpen}
        onClose={closeUpgradeModal}
        onSubscribed={async () => {
          await fetchUser();
        }}
      />
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) {
    throw new Error('useUpgradeModal must be used within UpgradeModalProvider');
  }
  return ctx;
}
