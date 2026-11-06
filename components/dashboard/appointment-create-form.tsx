'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppSelect } from '@/components/ui/app-select';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/toast';
import { createAppointment } from '@/server/actions/appointments';

type SelectOption = { id: string; label: string };

const PERIOD_LABEL: Record<string, string> = {
  pagi: 'Pagi',
  siang: 'Siang',
  sore: 'Sore',
  malam: 'Malam',
};

const TIME_OPTIONS: { period: string; value: string; label: string }[] = [];

for (let hour = 8; hour <= 21; hour++) {
  for (const minute of [0, 30]) {
    const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    let period: string;
    if (hour < 12) period = 'pagi';
    else if (hour < 15) period = 'siang';
    else if (hour < 19) period = 'sore';
    else period = 'malam';
    TIME_OPTIONS.push({ period, value, label: `${value} ${PERIOD_LABEL[period]}` });
  }
}

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
          type: String(formData.get('type') ?? 'THERAPY_SESSION') as
            'INITIAL_ASSESSMENT' | 'THERAPY_SESSION' | 'FOLLOW_UP' | 'EVALUATION',
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
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="patientId">Pasien</Label>
          <AppSelect
            id="patientId"
            name="patientId"
            required
            defaultValue={defaultPatientId ?? ''}
            placeholder="Pilih pasien"
            disabled={pending || patientOptions.length === 0}
            options={patientOptions.map((patient) => ({ value: patient.id, label: patient.label }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="therapistId">Terapis</Label>
          <AppSelect
            id="therapistId"
            name="therapistId"
            required
            placeholder="Pilih terapis"
            disabled={pending || therapistOptions.length === 0}
            options={therapistOptions.map((therapist) => ({ value: therapist.id, label: therapist.label }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Tanggal</Label>
          <input type="hidden" name="scheduledDate" value={scheduledDate} required />
          <DatePicker
            id="scheduledDate"
            value={scheduledDate}
            onChange={setScheduledDate}
            disabled={pending}
            disablePast
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime">Waktu Mulai</Label>
          <AppSelect
            id="startTime"
            name="startTime"
            required
            placeholder="Pilih jam"
            disabled={pending}
            defaultValue={defaultTime ?? ''}
            groups={(['pagi', 'siang', 'sore', 'malam'] as const).map((period) => ({
              label: PERIOD_LABEL[period],
              options: TIME_OPTIONS.filter((t) => t.period === period).map((t) => ({
                value: t.value,
                label: t.label,
              })),
            }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Durasi</Label>
          <AppSelect
            id="durationMinutes"
            name="durationMinutes"
            defaultValue="60"
            placeholder="Pilih durasi"
            disabled={pending}
            options={[15, 30, 45, 60, 90, 120].map((min) => ({
              value: String(min),
              label: `${min} menit`,
            }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Jenis</Label>
          <AppSelect
            id="type"
            name="type"
            defaultValue="INITIAL_ASSESSMENT"
            disabled={pending}
            options={[
              { value: 'INITIAL_ASSESSMENT', label: 'Assessment Awal' },
              { value: 'THERAPY_SESSION', label: 'Sesi Terapi' },
              { value: 'FOLLOW_UP', label: 'Tindak Lanjut' },
              { value: 'EVALUATION', label: 'Evaluasi' },
            ]}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="administrativeNote">Catatan Administratif</Label>
        <textarea
          id="administrativeNote"
          name="administrativeNote"
          disabled={pending}
          className="flex min-h-28 w-full resize-none rounded-xl border border-stone-200/90 bg-white px-3 py-2 text-sm leading-relaxed text-[#181700] focus:outline-none focus:border-[#181700] focus:ring-4 focus:ring-[#f7f000]/35"
        />
      </div>
    </form>
  );
}
