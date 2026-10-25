'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f7f000]">
              <LogOut className="h-5 w-5 text-[#181700]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[#181700] leading-tight">Konfirmasi Keluar</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">
                Sesi Anda akan keluar otomatis dalam{' '}
                <span className="font-bold text-[#181700]">{seconds}</span>{' '}
                detik. Pilih opsi di bawah ini.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 bg-[#F9FAFB] px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto h-10 px-4 rounded-full border border-stone-200 bg-white text-[#181700] font-semibold text-xs sm:text-sm transition-colors hover:bg-stone-100"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => {
              clearTimer();
              onConfirm();
            }}
            className="w-full sm:w-auto h-11 px-5 rounded-full bg-[#f7f000] hover:bg-[#e6de00] text-[#181700] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
          >
            <LogOut className="h-4 w-4" /> Keluar Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
