'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { updateAppointment } from '@/server/actions/appointments';
import type { AppointmentDetail } from '@/server/queries/appointments';

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

function openPicker(event: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) {
  try {
    event.currentTarget.showPicker();
  } catch {
    // Browser yang tidak mendukung showPicker tetap memakai picker native saat input diinteraksikan.
  }
}

export function AppointmentEditForm({
  appointment,
  therapistOptions,
}: {
  appointment: AppointmentDetail;
  therapistOptions: SelectOption[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  const dateValue = appointment.scheduledDate ? appointment.scheduledDate.split('T')[0].split(' ')[0] : '';
  const startTimeValue = appointment.startTime ?? '';

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
          type: String(formData.get('type') ?? 'THERAPY_SESSION') as
            'INITIAL_ASSESSMENT' | 'THERAPY_SESSION' | 'FOLLOW_UP' | 'EVALUATION',
          administrativeNote: String(formData.get('administrativeNote') ?? ''),
        });
        showToast('success', 'Appointment berhasil diperbarui.');
        router.push('/dashboard/appointments');
        router.refresh();
      } catch {
        showToast('error', 'Appointment tidak dapat diperbarui. Periksa data, scope pasien, dan jadwal terapis.');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Pasien</Label>
          <input type="hidden" name="patientId" value={appointment.patientId} />
          <div className="flex h-10 w-full items-center rounded-lg border border-input bg-surface px-3 text-sm text-muted-foreground">
            {appointment.patientName}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="therapistId">Terapis</Label>
          <select
            id="therapistId"
            name="therapistId"
            required
            defaultValue={appointment.therapistId}
            disabled={pending || therapistOptions.length === 0}
            className="flex h-10 w-full cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Pilih terapis</option>
            {therapistOptions.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Tanggal</Label>
          <Input id="scheduledDate" name="scheduledDate" type="date" required defaultValue={dateValue} disabled={pending} onClick={openPicker} onFocus={openPicker} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime">Waktu Mulai</Label>
          <select
            id="startTime"
            name="startTime"
            required
            defaultValue={startTimeValue}
            disabled={pending}
            className="flex h-10 w-full cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Pilih jam</option>
            {(['pagi', 'siang', 'sore', 'malam'] as const).map((period) => (
              <optgroup key={period} label={PERIOD_LABEL[period]}>
                {TIME_OPTIONS.filter((t) => t.period === period).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Durasi</Label>
          <select
            id="durationMinutes"
            name="durationMinutes"
            defaultValue={String(appointment.durationMinutes)}
            required
            disabled={pending}
            className="flex h-10 w-full cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Pilih durasi</option>
            {[15, 30, 45, 60, 90, 120].map((min) => (
              <option key={min} value={min}>
                {min} menit
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Jenis</Label>
          <select
            id="type"
            name="type"
            defaultValue={appointment.type}
            disabled={pending}
            className="flex h-10 w-full cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="INITIAL_ASSESSMENT">Assessment Awal</option>
            <option value="THERAPY_SESSION">Sesi Terapi</option>
            <option value="FOLLOW_UP">Tindak Lanjut</option>
            <option value="EVALUATION">Evaluasi</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="administrativeNote">Catatan Administratif</Label>
        <textarea
          id="administrativeNote"
          name="administrativeNote"
          disabled={pending}
          defaultValue={appointment.administrativeNote ?? ''}
          className="flex min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}
