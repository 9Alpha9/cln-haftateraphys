'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Mail, RotateCcw, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { restorePatient } from '@/server/actions/patients';
import { cn } from '@/lib/utils';
import type { getArchivedPatientsList } from '@/server/queries/patients';

type ArchivedPatient = Awaited<ReturnType<typeof getArchivedPatientsList>>['items'][number];

const STATUS_LABELS: Record<string, string> = {
  INTAKE: 'Intake',
  ACTIVE: 'Aktif',
  ON_HOLD: 'Ditunda',
  COMPLETED: 'Selesai',
  REFERRED: 'Rujuk',
  ARCHIVED: 'Diarsipkan',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(value: Date | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ArchivedPatientList({ items }: { items: ArchivedPatient[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [targetId, setTargetId] = useState<string | null>(null);

  function restore() {
    if (!targetId) return;
    startTransition(async () => {
      try {
        await restorePatient(targetId);
        toast.success('Pasien berhasil dipulihkan.');
        setTargetId(null);
        router.refresh();
      } catch {
        toast.error('Pasien tidak dapat dipulihkan. Coba lagi.');
      }
    });
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {items.map((patient) => (
          <li
            key={patient.id}
            className="group flex flex-col justify-between rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(24,23,0,0.09)] sm:p-5"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {patient.avatarKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={patient.avatarKey}
                      alt={patient.fullName}
                      className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-stone-200"
                    />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xs font-bold text-stone-500">
                      {getInitials(patient.fullName)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#181700] sm:text-base">
                      {patient.fullName}
                    </h3>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-stone-400">
                      {patient.medicalRecordNumber
                        ? `No. RM ${patient.medicalRecordNumber}`
                        : 'No. RM belum tersedia'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-600">
                  <Archive className="h-3 w-3" />
                  {STATUS_LABELS[patient.caseStatus] ?? patient.caseStatus}
                </span>
              </div>

              <div className="mt-3 space-y-2 rounded-2xl bg-[#FBFBFA] p-3 text-xs text-stone-600">
                <div className="flex min-w-0 items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                  <span className="truncate">{patient.email}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                  <span>Diarsipkan {formatDate(patient.archivedAt)}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-[11px] text-stone-500">
                  <span>Terdaftar {formatDate(patient.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-start">
              <button
                type="button"
                onClick={() => setTargetId(patient.id)}
                className={cn(
                  'inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-200)]',
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Pulihkan Pasien
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={Boolean(targetId)}
        title="Pulihkan Pasien?"
        description="Pasien akan kembali ke daftar pasien aktif dan dapat menerima jadwal sesi terapi kembali."
        confirmLabel="Ya, Pulihkan"
        pending={pending}
        onConfirm={restore}
        onCancel={() => setTargetId(null)}
      />
    </>
  );
}
