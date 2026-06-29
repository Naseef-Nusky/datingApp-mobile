import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import CreditPackModal from '../components/CreditPackModal';

const RefillModalContext = createContext(null);

export function RefillModalProvider({ children }) {
  const { fetchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState({});

  const openRefillModal = (options = {}) => {
    setModalOptions(options || {});
    setIsOpen(true);
  };

  const closeRefillModal = () => {
    setIsOpen(false);
    setModalOptions({});
  };

  return (
    <RefillModalContext.Provider value={{ openRefillModal, closeRefillModal }}>
      {children}
      <CreditPackModal
        isOpen={isOpen}
        onClose={closeRefillModal}
        onCreditsAdded={fetchUser}
        requiredCredits={modalOptions.requiredCredits}
        returnPath={modalOptions.returnPath}
      />
    </RefillModalContext.Provider>
  );
}

export function useRefillModal() {
  const ctx = useContext(RefillModalContext);
  if (!ctx) {
    throw new Error('useRefillModal must be used within RefillModalProvider');
  }
  return ctx;
}
