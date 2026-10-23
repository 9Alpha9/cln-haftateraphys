'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  User,
  ArrowRight,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewAppointmentButton } from '@/components/dashboard/appointments/new-appointment-button';
import type { CalendarAppointment } from '@/server/queries/appointment-calendar';

interface TherapistTodayScheduleProps {
  appointments: CalendarAppointment[];
  canCreate?: boolean;
}

const typeMap: Record<string, string> = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Sesi Lanjutan',
  EVALUATION: 'Evaluasi Klinis',
};

export function TherapistTodaySchedule({
  appointments,
  canCreate = true,
}: TherapistTodayScheduleProps) {
  // Ambil maksimal 4 jadwal terdekat
  const displayItems = appointments.slice(0, 4);

  return (
    <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#181700]">
              Antrean Sesi &amp; Tindak Lanjut Pasien
            </h3>
            <p className="text-xs text-stone-500">
              Jadwal janji temu terdekat yang memerlukan pendampingan Anda
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#181700] hover:text-stone-700 transition-colors self-start sm:self-auto"
        >
          <span>Seluruh Jadwal</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Appointment Queue List */}
      {displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-[#181700]">Tidak ada antrean sesi saat ini</h4>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            Seluruh janji temu untuk hari ini telah selesai atau belum ada jadwal baru yang ditambahkan.
          </p>
          {canCreate && (
            <NewAppointmentButton className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--hafta-ylw-100)] px-4 py-2 text-xs font-bold text-[#181700] hover:bg-[var(--hafta-ylw-200)] transition-colors shadow-2xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Buat Jadwal Baru</span>
            </NewAppointmentButton>
          )}
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {displayItems.map((appt) => {
            const dateStr = new Date(appt.scheduledDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            });
            const typeText = typeMap[appt.type] ?? appt.type;

            return (
              <div
                key={appt.id}
                className="flex flex-col gap-3 py-3.5 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between hover:bg-stone-50/70 p-2.5 rounded-2xl transition-colors"
              >
                {/* Waktu & Detail Pasien */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Waktu Pill */}
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-stone-100 px-3 py-2 text-center shrink-0 w-16">
                    <span className="font-mono text-xs font-extrabold text-[#181700] leading-none">
                      {appt.startTime}
                    </span>
                    <span className="mt-1 font-mono text-[10px] text-stone-400 leading-none">
                      {dateStr}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-[#181700] truncate">
                        {appt.patientName}
                      </p>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                        {typeText}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-stone-500 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Durasi: {appt.durationMinutes} menit</span>
                    </p>
                  </div>
                </div>

                {/* Tombol Aksi Langsung */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Link
                    href={`/dashboard/appointments`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#181700] hover:bg-[var(--hafta-ylw-100)] hover:border-[var(--hafta-ylw-200)] transition-all shadow-2xs"
                  >
                    <span>Lihat Rincian</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
