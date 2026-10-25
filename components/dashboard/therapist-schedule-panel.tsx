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
        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200/90 bg-white px-5 text-xs sm:text-[13px] font-semibold text-[#181700] shadow-2xs transition-colors hover:bg-stone-100 whitespace-nowrap shrink-0"
      >
        <CalendarClock className="h-4 w-4 shrink-0" />
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
          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              form={formId}
              disabled={isSaving}
              className="h-10 sm:h-11 px-5 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Jam Kerja
            </button>
          </div>
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
