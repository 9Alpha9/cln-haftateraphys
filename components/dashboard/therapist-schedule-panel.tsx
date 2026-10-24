'use client';

import { useId, useState } from 'react';
import { CalendarClock, Loader2, Save } from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import {
  TherapistScheduleEditor,
  TherapistScheduleManager,
} from '@/components/dashboard/therapist-schedule-manager';
import type { TherapistScheduleOverview } from '@/server/queries/therapist-schedules';

export function TherapistSchedulePanel({
  therapists,
  label = 'Atur Jadwal Kerja',
}: {
  therapists: TherapistScheduleOverview[];
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const formId = useId();
  const onlyTherapist = therapists.length === 1 ? therapists[0] : null;

  if (therapists.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 text-xs font-semibold text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-50)] whitespace-nowrap"
      >
        <CalendarClock className="h-4 w-4" />
        {label}
      </button>

      <GlobalSlideOver
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="xl"
        icon={<CalendarClock className="h-5 w-5" />}
        title="Jadwal Kerja Fisioterapis"
        subtitle={
          onlyTherapist ? onlyTherapist.therapistName : 'Atur jam kerja mingguan dan blokir tanggal'
        }
        footer={
          <button
            type="submit"
            form={formId}
            disabled={isSaving}
            className="inline-flex w-full sm:w-auto h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-6 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Jam Kerja
          </button>
        }
      >
        {onlyTherapist ? (
          <TherapistScheduleEditor
            therapist={onlyTherapist}
            formId={formId}
            onPendingChange={setIsSaving}
          />
        ) : (
          <TherapistScheduleManager
            therapists={therapists}
            formId={formId}
            onPendingChange={setIsSaving}
          />
        )}
      </GlobalSlideOver>
    </>
  );
}
