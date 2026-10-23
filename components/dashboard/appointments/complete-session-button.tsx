'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { completeAppointmentSession } from '@/server/actions/therapy-completion';

export function CompleteSessionButton({
  appointmentId,
  className,
}: {
  appointmentId: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function handleComplete() {
    startTransition(async () => {
      try {
        await completeAppointmentSession({ appointmentId });
        showToast('success', 'Sesi terapi ditandai selesai.');
        setIsOpen(false);
        router.refresh();
      } catch (error) {
        showToast(
          'error',
          error instanceof Error && error.message !== 'Forbidden'
            ? error.message
            : 'Sesi terapi tidak dapat diselesaikan.',
        );
        setIsOpen(false);
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={className}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        <span>Selesaikan</span>
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Selesaikan Sesi Terapi?"
        description="Sesi akan ditandai selesai dan pasien menerima notifikasi. Pastikan catatan terapi sesi ini sudah diisi."
        confirmLabel="Ya, Selesaikan"
        pending={pending}
        onConfirm={handleComplete}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
