'use client';

import { Pencil } from 'lucide-react';
import {
  AppointmentEditDrawer,
  useAppointmentEditDrawer,
} from '@/components/dashboard/appointments/appointment-edit-drawer';

type Props = {
  appointmentId: string;
  className?: string;
  label?: string;
  onBeforeOpen?: () => void;
};

export function AppointmentEditButton({
  appointmentId,
  className,
  label = 'Edit',
  onBeforeOpen,
}: Props) {
  const editor = useAppointmentEditDrawer();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onBeforeOpen?.();
          editor.openEdit(appointmentId);
        }}
        className={className}
      >
        <Pencil className="h-3.5 w-3.5" />
        <span>{label}</span>
      </button>
      <AppointmentEditDrawer
        isOpen={editor.isOpen}
        isLoading={editor.isLoading}
        data={editor.data}
        onClose={editor.closeEdit}
      />
    </>
  );
}
