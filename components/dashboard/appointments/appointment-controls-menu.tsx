'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, MoreVertical } from 'lucide-react';
import { TherapistSchedulePanel } from '@/components/dashboard/therapist-schedule-panel';
import type { TherapistScheduleOverview } from '@/server/queries/therapist-schedules';

export function AppointmentControlsMenu({
  role,
  scheduleOverview,
}: {
  role: string;
  scheduleOverview: TherapistScheduleOverview[];
}) {
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="relative ml-auto inline-flex shrink-0">
      <button
        type="button"
        aria-label="Menu jadwal"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex aspect-square h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white p-0 text-[#181700] transition-all hover:bg-stone-100 focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f7f000]/35"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default bg-transparent"
          />
          <div className="absolute right-0 top-full z-20 mt-2 flex w-52 origin-top-right flex-col gap-1 rounded-2xl border border-stone-200/90 bg-white p-2 shadow-[0_12px_32px_rgba(24,23,0,0.14)]">
            <Link
              href="/dashboard/calendar"
              onClick={() => setOpen(false)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-transparent px-3.5 py-2.5 text-left text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100 sm:text-[13px]"
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-stone-600" />
              Tampilan Kalender
            </Link>

            {scheduleOverview.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setScheduleOpen(true);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-transparent px-3.5 py-2.5 text-left text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100 sm:text-[13px]"
              >
                <Clock className="h-4 w-4 shrink-0 text-stone-600" />
                {role === 'THERAPIST' ? 'Jadwal Kerja Saya' : 'Jadwal Kerja Terapis'}
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      <TherapistSchedulePanel
        therapists={scheduleOverview}
        label={role === 'THERAPIST' ? 'Jadwal Kerja Saya' : 'Jadwal Kerja Terapis'}
        hideTrigger
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />
    </div>
  );
}
