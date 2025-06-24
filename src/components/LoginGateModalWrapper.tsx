// components/LoginGateModalWrapper.tsx
'use client';

import { useLoginGate } from '@/contexts/LoginGateContext';
import LoginRequiredModal from '@/components/LoginRequiredModal';

export default function LoginGateModalWrapper() {
  const { showModal, closeModal } = useLoginGate();

  return <LoginRequiredModal isOpen={showModal} onClose={closeModal} />;
}
