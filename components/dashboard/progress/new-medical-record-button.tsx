'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MedicalRecordFormDrawer } from '@/components/dashboard/progress/medical-record-form-drawer';

export function NewMedicalRecordButton({ patientOptions }: { patientOptions: { id: string; label: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="h-11 w-full gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] shadow-2xs hover:bg-[var(--hafta-ylw-200)] sm:w-auto sm:px-5 sm:text-[13px]">
        <Plus className="h-4 w-4 shrink-0" />
        <span>Tambah Rekam Medis</span>
      </Button>
      <MedicalRecordFormDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        patientOptions={patientOptions}
      />
    </>
  );
}
