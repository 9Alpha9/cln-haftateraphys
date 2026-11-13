'use client';

import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { AppSelect } from '@/components/ui/app-select';
import { DatePicker } from '@/components/ui/date-picker';

export type AppointmentSelectOption = { id: string; label: string };

const PERIOD_LABEL: Record<string, string> = {
  pagi: 'Pagi',
  siang: 'Siang',
  sore: 'Sore',
  malam: 'Malam',
};

/** Shared time options for the appointment create/edit forms. */
export const APPOINTMENT_TIME_OPTIONS: { period: string; value: string; label: string }[] = [];

for (let hour = 8; hour <= 21; hour++) {
  for (const minute of [0, 30]) {
    const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    let period: string;
    if (hour < 12) period = 'pagi';
    else if (hour < 15) period = 'siang';
    else if (hour < 19) period = 'sore';
    else period = 'malam';
    APPOINTMENT_TIME_OPTIONS.push({ period, value, label: `${value} ${PERIOD_LABEL[period]}` });
  }
}

export function appointmentTimeGroups() {
  return (['pagi', 'siang', 'sore', 'malam'] as const).map((period) => ({
    label: PERIOD_LABEL[period],
    options: APPOINTMENT_TIME_OPTIONS.filter((option) => option.period === period).map((option) => ({
      value: option.value,
      label: option.label,
    })),
  }));
}

export function AppointmentFormFields({
  patientField,
  therapistOptions,
  defaultTherapistId,
  scheduledDate,
  onScheduledDateChange,
  defaultStartTime,
  defaultDuration,
  defaultNote,
  pending,
  noteClassName,
  durationRequired = false,
}: {
  /** Patient input is rendered by the caller (select for create, read-only for edit). */
  patientField: ReactNode;
  therapistOptions: AppointmentSelectOption[];
  defaultTherapistId?: string;
  scheduledDate: string;
  onScheduledDateChange: (value: string) => void;
  defaultStartTime?: string;
  defaultDuration?: string;
  defaultNote?: string;
  pending: boolean;
  noteClassName?: string;
  durationRequired?: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Pasien</Label>
          {patientField}
        </div>
        <div className="space-y-2">
          <Label htmlFor="therapistId">Terapis</Label>
          {therapistOptions.length === 1 ? (
            <>
              <input type="hidden" name="therapistId" value={therapistOptions[0]!.id} />
              <div className="flex h-10 w-full items-center rounded-xl border border-stone-200/90 bg-stone-50 px-3 text-sm text-[#181700]">
                {therapistOptions[0]!.label}
              </div>
            </>
          ) : (
            <AppSelect
              id="therapistId"
              name="therapistId"
              required
              placeholder="Pilih terapis"
              defaultValue={defaultTherapistId}
              disabled={pending || therapistOptions.length === 0}
              options={therapistOptions.map((therapist) => ({
                value: therapist.id,
                label: therapist.label,
              }))}
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Tanggal</Label>
          <input type="hidden" name="scheduledDate" value={scheduledDate} required />
          <DatePicker
            id="scheduledDate"
            value={scheduledDate}
            onChange={onScheduledDateChange}
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
            defaultValue={defaultStartTime}
            groups={appointmentTimeGroups()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Durasi</Label>
          <AppSelect
            id="durationMinutes"
            name="durationMinutes"
            placeholder="Pilih durasi"
            defaultValue={defaultDuration ?? '60'}
            required={durationRequired}
            disabled={pending}
            options={[15, 30, 45, 60, 90, 120].map((min) => ({
              value: String(min),
              label: `${min} menit`,
            }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="administrativeNote">Catatan Administratif</Label>
        <textarea
          id="administrativeNote"
          name="administrativeNote"
          disabled={pending}
          defaultValue={defaultNote}
          className={
            noteClassName ??
            'flex min-h-28 w-full resize-none rounded-xl border border-stone-200/90 bg-white px-3 py-2 text-sm leading-relaxed text-[#181700] focus:outline-none focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-org-200)]/35'
          }
        />
      </div>
    </>
  );
}
