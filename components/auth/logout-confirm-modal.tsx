'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/components/ui/use-body-scroll-lock';

export type LogoutConfirmModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const COUNTDOWN_SECONDS = 5;

export function LogoutConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;
  return <ModalContent onConfirm={onConfirm} onCancel={onCancel} />;
}

function ModalContent({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  useBodyScrollLock(true);
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((current) => {
        const next = current - 1;
        return next > 0 ? next : 0;
      });
    }, 1000);
    return clearTimer;
  }, [clearTimer]);

  useEffect(() => {
    if (seconds === 0) {
      clearTimer();
      onConfirm();
    }
  }, [seconds, onConfirm, clearTimer]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-200/70 bg-white shadow-[0_18px_50px_rgba(24,23,0,0.18)]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)]">
              <LogOut className="h-5 w-5 text-[#181700]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-tight text-[#181700] sm:text-lg">Konfirmasi Keluar</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-600 sm:text-sm">
                Sesi Anda akan keluar otomatis dalam{' '}
                <span className="font-bold text-[#181700]">{seconds}</span>{' '}
                detik. Pilih opsi di bawah ini.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-stone-100 bg-[#FAFAF8] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-3 sm:px-5 sm:py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 w-full rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-[#181700] transition-all hover:bg-stone-100 active:scale-[0.99] sm:w-auto"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => {
              clearTimer();
              onConfirm();
            }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700] transition-all hover:bg-[var(--hafta-org-200)] active:scale-[0.99] sm:w-auto"
          >
            <LogOut className="h-4 w-4" /> Keluar Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
