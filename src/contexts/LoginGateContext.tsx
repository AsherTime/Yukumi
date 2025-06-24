// context/LoginGateContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation'; 

interface LoginGateContextType {
  requireLogin: (callback?: () => void) => boolean;
  showModal: boolean;
  closeModal: () => void;
}

const LoginGateContext = createContext<LoginGateContextType | undefined>(undefined);

export const LoginGateProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [queuedCallback, setQueuedCallback] = useState<(() => void) | null>(null);

  const requireLogin = (callback?: () => void) => {
    if (!user) {
      setShowModal(true);
      if (callback) setQueuedCallback(() => callback);
      return false;
    }
    callback?.();
    return true;
  };

  const closeModal = () => {
    setShowModal(false);
    setQueuedCallback(null);
  };

  useEffect(() => {
    if (showModal) {
      closeModal();
    }
  }, [pathname]);

  return (
    <LoginGateContext.Provider value={{ requireLogin, showModal, closeModal }}>
      {children}
    </LoginGateContext.Provider>
  );
};

export const useLoginGate = () => {
  const context = useContext(LoginGateContext);
  if (!context) {
    throw new Error('useLoginGate must be used within a LoginGateProvider');
  }
  return context;
};
