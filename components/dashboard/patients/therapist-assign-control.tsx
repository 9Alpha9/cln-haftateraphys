'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserCog } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { useToast } from '@/components/ui/toast';
import { assignPatientTherapist } from '@/server/actions/patient-assignment';

export function TherapistAssignControl({
  patientId,
  currentTherapistId,
  options,
}: {
  patientId: string;
  currentTherapistId: string | null;
  options: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [value, setValue] = useState(currentTherapistId ?? '');
  const [pending, startTransition] = useTransition();

  function save() {
    if (!value) {
      showToast('error', 'Pilih terapis terlebih dahulu.');
      return;
    }
    startTransition(async () => {
      const result = await assignPatientTherapist({ patientId, therapistUserId: value });
      if (!result.ok) {
        showToast('error', result.error);
        return;
      }
      showToast('success', 'Terapis penanggung jawab berhasil diperbarui.');
      router.refresh();
    });
  }

  return (
    <div className="mt-3 space-y-1.5">
      <label htmlFor="patient-therapist" className="text-[11px] font-semibold text-stone-500">
        Tetapkan terapis penanggung jawab
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <AppSelect
          id="patient-therapist"
          value={value}
          onChange={setValue}
          placeholder="Pilih terapis"
          disabled={pending || options.length === 0}
          options={options.map((option) => ({ value: option.id, label: option.label }))}
          className="sm:flex-1"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending || !value || value === currentTherapistId}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--hafta-org-100)]"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserCog className="h-3.5 w-3.5" />
          )}
          {pending ? 'Menyimpan…' : 'Tetapkan'}
        </button>
      </div>
      {options.length === 0 ? (
        <p className="text-[11px] text-stone-500">
          Belum ada akun terapis aktif yang dapat ditetapkan.
        </p>
      ) : null}
    </div>
  );
}
