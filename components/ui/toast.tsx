'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info';

type ToastContextValue = {
  showToast: (type: ToastType, message: string) => void;
};

export function useToast(): ToastContextValue {
  const showToast = useCallback((type: ToastType, message: string) => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast.info(message);
    }
  }, []);

  return { showToast };
}

// ToastProvider dipertahankan sebagai fragment kosong agar tidak merusak tree layout.tsx
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

