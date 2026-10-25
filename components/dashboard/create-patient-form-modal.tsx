'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
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
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          buttonClassName ??
          'h-11 px-5 rounded-full bg-[#f7f000] hover:bg-[#e6de00] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex flex-row items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs w-full sm:w-auto'
        }
      >
        <UserPlus className="h-4 w-4" /> Daftarkan Pasien
      </button>
      <CreatePatientForm userOptions={userOptions} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
