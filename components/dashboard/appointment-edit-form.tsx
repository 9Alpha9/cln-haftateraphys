'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { updateAppointment } from '@/server/actions/appointments';
import type { AppointmentDetail } from '@/server/queries/appointments';
import {
  AppointmentFormFields,
  type AppointmentSelectOption,
} from '@/components/dashboard/appointments/appointment-form-fields';

type SelectOption = AppointmentSelectOption;

export function AppointmentEditForm({
  appointment,
  therapistOptions,
  formId,
  onSuccess,
  onCancel,
  onPendingChange,
}: {
  appointment: AppointmentDetail;
  therapistOptions: SelectOption[];
  formId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [scheduledDate, setScheduledDate] = useState(
    appointment.scheduledDate ? appointment.scheduledDate.split('T')[0].split(' ')[0] : '',
  );
  const router = useRouter();
  const { showToast } = useToast();

  const startTimeValue = (appointment.startTime ?? '').slice(0, 5);

  useEffect(() => {
    onPendingChange?.(pending);
  }, [onPendingChange, pending]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await updateAppointment({
          appointmentId: appointment.id,
          patientId: String(formData.get('patientId') ?? ''),
          therapistId: String(formData.get('therapistId') ?? ''),
          scheduledDate: String(formData.get('scheduledDate') ?? ''),
          startTime: String(formData.get('startTime') ?? ''),
          durationMinutes: Number(formData.get('durationMinutes') ?? 60),
          administrativeNote: String(formData.get('administrativeNote') ?? ''),
        });
        showToast('success', 'Appointment berhasil diperbarui.');
        router.refresh();
        if (onSuccess) onSuccess();
        else router.push('/dashboard/appointments');
      } catch {
        showToast('error', 'Appointment tidak dapat diperbarui. Periksa data, scope pasien, dan jadwal terapis.');
      }
    });
  }

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
      <AppointmentFormFields
        pending={pending}
        therapistOptions={therapistOptions}
        defaultTherapistId={appointment.therapistId}
        scheduledDate={scheduledDate}
        onScheduledDateChange={setScheduledDate}
        defaultStartTime={startTimeValue}
        defaultDuration={String(appointment.durationMinutes)}
        defaultNote={appointment.administrativeNote ?? ''}
        durationRequired
        noteClassName="flex min-h-28 w-full resize-none rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm leading-relaxed text-[#181700] focus:outline-none focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-org-200)]/30"
        patientField={
          <>
            <input type="hidden" name="patientId" value={appointment.patientId} />
            <div className="flex h-10 w-full items-center rounded-xl border border-stone-300 bg-stone-100 px-3 text-sm text-stone-500">
              {appointment.patientName}
            </div>
          </>
        }
      />
    </form>
  );
}
