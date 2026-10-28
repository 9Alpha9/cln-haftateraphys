'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { useToast } from '@/components/ui/toast';
import { completeTherapyProgram } from '@/server/actions/therapy-completion';

export function CompleteProgramButton({
  patientId,
  patientName,
  className,
  onCompleted,
}: {
  patientId: string;
  patientName: string;
  className?: string;
  onCompleted?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function handleClose() {
    if (pending) return;
    setIsOpen(false);
    setSummary('');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await completeTherapyProgram({ patientId, summary });
        showToast('success', 'Program terapi pasien ditandai selesai.');
        setIsOpen(false);
        setSummary('');
        onCompleted?.();
        router.refresh();
      } catch (error) {
        showToast(
          'error',
          error instanceof Error && error.message !== 'Forbidden'
            ? error.message
            : 'Program terapi tidak dapat diselesaikan.',
        );
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={className}>
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Selesaikan Program</span>
      </button>

      <GlobalSlideOver
        isOpen={isOpen}
        onClose={handleClose}
        size="md"
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="Selesaikan Program Terapi"
        subtitle={patientName}
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <button
              type="submit"
              form="complete-therapy-program-form"
              disabled={pending || summary.trim().length < 10}
              className="inline-flex h-10 sm:h-11 px-5 items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Selesaikan Program
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={pending}
              className="h-10 sm:h-11 px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        }
      >
        <form id="complete-therapy-program-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)]/50 p-4 text-xs leading-relaxed text-stone-600">
            Program akan ditandai <strong className="text-[#181700]">COMPLETED</strong>. Pastikan tidak ada
            sesi terjadwal yang masih aktif. Pasien akan menerima notifikasi.
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-[#181700]">Ringkasan penutupan terapi</span>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={5}
              required
              minLength={10}
              maxLength={2000}
              disabled={pending}
              placeholder="Contoh: Target mobilitas tercapai, pasien mandiri menjalankan latihan rumah, program ditutup dengan edukasi pemeliharaan."
              className="mt-1.5 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-[#181700] outline-none transition-colors placeholder:text-stone-400 focus:border-[var(--hafta-ylw-300)] focus:ring-2 focus:ring-[var(--hafta-ylw-100)]/60 disabled:opacity-60"
            />
          </label>
          <p className="text-[11px] text-stone-400">Minimal 10 karakter. {summary.trim().length}/2000</p>
        </form>
      </GlobalSlideOver>
    </>
  );
}
