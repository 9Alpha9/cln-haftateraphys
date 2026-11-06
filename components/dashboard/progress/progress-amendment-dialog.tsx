'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FilePenLine } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { createProgressAmendment } from '@/server/actions/therapy-progress';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';

export function ProgressAmendmentDialog({
  record,
  onClose,
}: {
  record: TherapyProgressView;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (reason.trim().length < 10) {
      setError('Alasan amandemen wajib diisi minimal 10 karakter.');
      return;
    }

    startTransition(async () => {
      const result = await createProgressAmendment({ recordId: record.id, reason });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      showToast(
        'success',
        'Draft amandemen dibuat. Periksa dan finalisasi setelah koreksi selesai.',
      );
      router.refresh();
      onClose();
    });
  }

  return (
    <ConfirmDialog
      isOpen
      title="Buat Amandemen Rekam"
      description={
        <div className="space-y-3">
          <p>
            Rekam final tetap tersimpan dan tidak diubah. Sistem akan membuat draft revisi
            berdasarkan rekam tanggal{' '}
            <span className="font-semibold text-[#181700]">
              {new Date(record.recordedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            . Setelah draft difinalisasi, rekam lama otomatis digantikan.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#181700]">
              Alasan amandemen <span className="text-red-600">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(null);
              }}
              rows={3}
              maxLength={500}
              placeholder="Contoh: koreksi diagnosis setelah hasil pemeriksaan lanjutan."
              className="w-full resize-y rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#181700] outline-none transition-colors placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-ylw-100)]"
            />
          </label>
          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      }
      icon={<FilePenLine className="h-5 w-5" />}
      confirmLabel={pending ? 'Membuat…' : 'Buat Draft Amandemen'}
      cancelLabel="Batal"
      pending={pending}
      onConfirm={submit}
      onCancel={onClose}
    />
  );
}
