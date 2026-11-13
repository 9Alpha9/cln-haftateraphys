'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppSelect } from '@/components/ui/app-select';
import { useToast } from '@/components/ui/toast';
import { createAppointment } from '@/server/actions/appointments';
import {
  AppointmentFormFields,
  type AppointmentSelectOption,
} from '@/components/dashboard/appointments/appointment-form-fields';

type SelectOption = AppointmentSelectOption;

export function AppointmentCreateForm({
  patientOptions,
  therapistOptions,
  defaultPatientId,
  defaultDate,
  defaultTime,
  onSuccess,
  onCancel,
  formId,
  onPendingChange,
}: {
  patientOptions: SelectOption[];
  therapistOptions: SelectOption[];
  defaultPatientId?: string;
  defaultDate?: string;
  defaultTime?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  formId?: string;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [scheduledDate, setScheduledDate] = useState(defaultDate ?? '');
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    onPendingChange?.(pending);
  }, [onPendingChange, pending]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await createAppointment({
          patientId: String(formData.get('patientId') ?? ''),
          therapistId: String(formData.get('therapistId') ?? ''),
          scheduledDate: String(formData.get('scheduledDate') ?? ''),
          startTime: String(formData.get('startTime') ?? ''),
          durationMinutes: Number(formData.get('durationMinutes') ?? 60),
          administrativeNote: String(formData.get('administrativeNote') ?? ''),
        });
        showToast('success', 'Appointment berhasil dibuat.');
        router.refresh();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard/appointments');
        }
      } catch {
        showToast('error', 'Appointment tidak dapat dibuat. Periksa data, scope pasien, dan jadwal terapis.');
      }
    });
  }

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
      <AppointmentFormFields
        pending={pending}
        therapistOptions={therapistOptions}
        scheduledDate={scheduledDate}
        onScheduledDateChange={setScheduledDate}
        defaultStartTime={defaultTime}
        defaultDuration="60"
        patientField={
          <AppSelect
            id="patientId"
            name="patientId"
            required
            defaultValue={defaultPatientId ?? ''}
            placeholder="Pilih pasien"
            disabled={pending || patientOptions.length === 0}
            options={patientOptions.map((patient) => ({ value: patient.id, label: patient.label }))}
          />
        }
      />
    </form>
  );
}
