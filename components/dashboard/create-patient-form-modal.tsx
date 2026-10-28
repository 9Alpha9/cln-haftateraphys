'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePatientForm } from '@/components/dashboard/create-patient-form';

type UserOption = { id: string; name: string | null; email: string };

export function CreatePatientFormModal({
  userOptions,
  buttonClassName,
}: {
  userOptions: UserOption[];
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName ?? 'w-full sm:w-auto shadow-2xs'}
      >
        <UserPlus className="h-4 w-4 shrink-0" />
        Daftarkan Pasien
      </Button>
      <CreatePatientForm userOptions={userOptions} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
