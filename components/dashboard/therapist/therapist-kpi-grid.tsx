'use client';

import React from 'react';
import {
  CalendarCheck2,
  Users,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react';
import { NotchedCard } from '@/components/ui/notched-card';
import type { DashboardStats } from '@/server/queries/dashboard-stats';

interface TherapistKpiGridProps {
  stats: DashboardStats;
  isTherapist?: boolean;
}

export function TherapistKpiGrid({
  stats,
  isTherapist = true,
}: TherapistKpiGridProps) {
  const { kpis } = stats;

  // Wording kontekstual & jujur (anti persentase palsu)
  const apptContext =
    kpis.totalAppointments > 0
      ? `${kpis.totalAppointments} sesi terjadwal aktif`
      : 'Belum ada jadwal sesi';

  const patientContext =
    kpis.activePatients > 0
      ? `${kpis.activePatients} pasien terhubung langsung`
      : 'Belum ada pasien terhubung';

  const intakeContext =
    kpis.submittedIntakes > 0
      ? `${kpis.submittedIntakes} form menunggu peninjauan`
      : 'Seluruh intake telah diverifikasi';

  const caseContext =
    kpis.completedCases > 0
      ? `${kpis.completedCases} evaluasi final tercatat`
      : 'Belum ada kasus difinalisasi';

  const cards = [
    {
      id: 'appointments',
      title: isTherapist ? 'Jadwal Saya' : 'Total Janji Temu',
      value: kpis.totalAppointments,
      badge: kpis.totalAppointments > 0 ? 'Terjadwal' : 'Belum ada',
      context: apptContext,
      icon: CalendarCheck2,
      iconBg: 'bg-[var(--hafta-ylw-50)] text-[#181700]',
      href: '/dashboard/appointments',
      buttonText: 'Lihat Jadwal',
      variant: 'white' as const,
      showRings: false,
    },
    {
      id: 'patients',
      title: isTherapist ? 'Pasien Terhubung' : 'Pasien Terdaftar',
      value: kpis.activePatients,
      badge: 'Data Pasien',
      context: patientContext,
      icon: Users,
      iconBg: 'bg-white border border-stone-200 text-[#181700]',
      href: '/dashboard/patients',
      buttonText: 'Daftar Pasien',
      variant: 'white' as const,
      showRings: false,
    },
    {
      id: 'intake',
      title: 'Intake Menunggu',
      value: kpis.submittedIntakes,
      badge: kpis.submittedIntakes > 0 ? 'Perlu Ditinjau' : 'Tuntas',
      context: intakeContext,
      icon: ClipboardList,
      iconBg: kpis.submittedIntakes > 0 ? 'bg-[#181700] text-[var(--hafta-ylw-100)]' : 'bg-stone-100 text-stone-700',
      href: '/dashboard/intake',
      buttonText: 'Tinjau Intake',
      // Jika ada intake yang butuh aksi terapis, kartu otomatis beraksen kuning Hafta!
      variant: kpis.submittedIntakes > 0 ? ('accent' as const) : ('white' as const),
      showRings: kpis.submittedIntakes > 0,
    },
    {
      id: 'completed',
      title: isTherapist ? 'Kasus Saya Selesai' : 'Kasus Selesai',
      value: kpis.completedCases,
      badge: 'Evaluasi Final',
      context: caseContext,
      icon: CheckCircle2,
      iconBg: 'bg-[var(--hafta-ylw-50)] text-[#181700]',
      href: '/dashboard/progress',
      buttonText: 'Buka Catatan',
      variant: 'white' as const,
      showRings: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <NotchedCard
          key={card.id}
          variant={card.variant}
          showRings={card.showRings}
          icon={
            <div className={`flex h-11 w-11 items-center justify-center rounded-full shadow-2xs ${card.iconBg}`}>
              <card.icon className="h-5 w-5" />
            </div>
          }
          badge={card.badge}
          title={card.title}
          description={
            <div className="mt-2 space-y-1">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-[#181700] leading-none block">
                {card.value}
              </span>
              <span className="text-[11px] font-medium text-stone-500 leading-tight block">
                {card.context}
              </span>
            </div>
          }
          href={card.href}
          buttonText={card.buttonText}
          className="h-full min-h-[250px]"
        />
      ))}
    </div>
  );
}
