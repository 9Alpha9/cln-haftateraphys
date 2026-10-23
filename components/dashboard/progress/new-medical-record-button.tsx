'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { MedicalRecordFormDrawer } from '@/components/dashboard/progress/medical-record-form-drawer';

export function NewMedicalRecordButton({ patientOptions }: { patientOptions: { id: string; label: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)]"
      >
        <Plus className="h-4 w-4" />
        <span>Tambah Evaluasi</span>
      </button>
      <MedicalRecordFormDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        patientOptions={patientOptions}
      />
    </>
  );
}
