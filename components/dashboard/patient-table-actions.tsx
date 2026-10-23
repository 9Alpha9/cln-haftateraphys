'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { archivePatient } from '@/server/actions/patients';
import { PatientDetailDrawer } from '@/components/dashboard/patients/patient-detail-drawer';

export function PatientTableActions({ patientId, canArchive }: { patientId: string; canArchive: boolean }) {
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);

  function archive() {
    startTransition(async () => {
      await archivePatient(patientId);
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => setShowDetail(true)}
        className="h-9 px-3.5 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shrink-0 bg-white hover:bg-[var(--hafta-ylw-100)] text-[#181700] border border-stone-200/90 hover:border-[var(--hafta-ylw-200)]"
      >
        <Eye className="h-3.5 w-3.5" /> <span>Buka</span>
      </button>
      <PatientDetailDrawer isOpen={showDetail} onClose={() => setShowDetail(false)} patientId={patientId} />
      {canArchive ? (
        <>
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => setShowConfirm(true)}>
            <Archive /> <span className="hidden sm:inline">Arsipkan</span>
          </Button>
          <ConfirmDialog
            isOpen={showConfirm}
            title="Arsipkan Pasien?"
            description="Data klinis pasien ini tidak akan dihapus dan masih dapat diakses melalui filter riwayat."
            confirmLabel="Ya, Arsipkan"
            variant="destructive"
            pending={pending}
            onConfirm={archive}
            onCancel={() => setShowConfirm(false)}
          />
        </>
      ) : null}
    </div>
  );
}
