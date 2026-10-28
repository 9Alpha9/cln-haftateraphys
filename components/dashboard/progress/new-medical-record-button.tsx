'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MedicalRecordFormDrawer } from '@/components/dashboard/progress/medical-record-form-drawer';

export function NewMedicalRecordButton({ patientOptions }: { patientOptions: { id: string; label: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="px-5 gap-2">
        <Plus className="h-4 w-4 shrink-0" />
        <span>Tambah Evaluasi</span>
      </Button>
      <MedicalRecordFormDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        patientOptions={patientOptions}
      />
    </>
  );
}
