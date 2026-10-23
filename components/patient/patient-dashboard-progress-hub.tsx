'use client';

import { useState } from 'react';
import { FolderTabPanel, type FolderActivityItem } from '@/components/ui/folder-tab-panel';
import type {
  PatientAppointmentRequestView,
  PatientPortalAppointment,
} from '@/server/queries/patient-portal';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';

type HubTab = 'target' | 'kehadiran' | 'aktivitas';

const TABS = [
  { id: 'target', label: 'Target' },
  { id: 'kehadiran', label: 'Hadir' },
  { id: 'aktivitas', label: 'Aktivitas' },
];

function toDateKey(value: Date | string) {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function formatShortDate(value: Date | string) {
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    COMPLETED: 'Selesai',
    NO_SHOW: 'Tidak hadir',
    CANCELLED: 'Dibatalkan',
    SCHEDULED: 'Terjadwal',
    CONFIRMED: 'Terkonfirmasi',
  };
  return labels[status] ?? status;
}

export function PatientDashboardProgressHub({
  treatmentGoal,
  appointments,
  requests,
  records,
  totalRecords,
}: {
  treatmentGoal: string | null;
  appointments: PatientPortalAppointment[];
  requests: PatientAppointmentRequestView[];
  records: TherapyProgressView[];
  totalRecords: number;
}) {
  const [activeTab, setActiveTab] = useState<HubTab>('target');

  const completed = appointments.filter((appointment) => appointment.status === 'COMPLETED').length;
  const noShow = appointments.filter((appointment) => appointment.status === 'NO_SHOW').length;
  const eligibleSessions = completed + noShow;
  const attendance = eligibleSessions ? Math.round((completed / eligibleSessions) * 100) : 0;
  const scheduled = appointments.filter((appointment) =>
    ['SCHEDULED', 'CONFIRMED'].includes(appointment.status),
  ).length;
  const pendingRequests = requests.filter((request) => request.status === 'PENDING').length;
  const today = toDateKey(new Date());

  const recentRecords: FolderActivityItem[] = records.map((record) => ({
    id: `record-${record.id}`,
    title: 'Evaluasi terapi',
    subtitle: record.summary ?? record.diagnosis ?? record.therapistName ?? 'Catatan fisioterapis',
    time: formatShortDate(record.recordedAt),
    kind: 'Catatan',
    href: '/dashboard/progress',
  }));

  const sessionHistory: FolderActivityItem[] = appointments
    .filter((appointment) => toDateKey(appointment.scheduledDate) <= today)
    .sort((a, b) => toDateKey(b.scheduledDate).localeCompare(toDateKey(a.scheduledDate)))
    .slice(0, 4)
    .map((appointment) => ({
      id: `session-${appointment.id}`,
      title: `Sesi ${appointment.startTime}`,
      subtitle: `${appointment.therapistName ?? 'Fisioterapis Hafta'} · ${statusLabel(appointment.status)}`,
      time: formatShortDate(appointment.scheduledDate),
      kind: statusLabel(appointment.status),
      href: '/dashboard/appointments',
    }));

  const latestActivity: FolderActivityItem[] = [
    ...records.map((record) => ({
      id: `activity-record-${record.id}`,
      title: 'Evaluasi terapi dibagikan',
      subtitle: record.summary ?? record.therapistName ?? 'Catatan fisioterapis',
      time: formatShortDate(record.recordedAt),
      kind: 'Catatan',
      href: '/dashboard/progress',
      date: record.recordedAt,
    })),
    ...requests.map((request) => ({
      id: `activity-request-${request.id}`,
      title: request.status === 'PENDING' ? 'Pengajuan jadwal dikirim' : 'Status pengajuan diperbarui',
      subtitle: `${formatShortDate(request.requestedDate)} · ${request.startTime}`,
      time: formatShortDate(request.createdAt),
      kind: 'Pengajuan',
      href: '/dashboard/appointments',
      date: request.createdAt,
    })),
    ...appointments.map((appointment) => ({
      id: `activity-session-${appointment.id}`,
      title: 'Sesi terapi terjadwal',
      subtitle: `${appointment.therapistName ?? 'Fisioterapis Hafta'} · ${statusLabel(appointment.status)}`,
      time: formatShortDate(appointment.scheduledDate),
      kind: 'Jadwal',
      href: '/dashboard/appointments',
      date: new Date(`${toDateKey(appointment.scheduledDate)}T${appointment.startTime}:00`),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 4)
    .map(({ id, title, subtitle, time, kind, href }) => ({ id, title, subtitle, time, kind, href }));

  const tabContent: Record<
    HubTab,
    {
      totalValue: string | number;
      totalLabel: string;
      context: string;
      summaryTitle: string;
      summaryTags: { label: string; count: number }[];
      metrics: { label: string; value: string | number; percentage: number; barStyle: 'tick' | 'solid' | 'accent' }[];
      listTitle: string;
      items: FolderActivityItem[];
      emptyMessage: string;
      listActionHref: string;
      listActionLabel: string;
    }
  > = {
    target: {
      totalValue: treatmentGoal ? 'Aktif' : '—',
      totalLabel: 'TARGET',
      context: treatmentGoal ?? 'Target terapi akan tampil setelah asesmen awal selesai.',
      summaryTitle: 'Fokus Program',
      summaryTags: [
        { label: 'Sesi selesai', count: completed },
        { label: 'Catatan medis', count: totalRecords },
        { label: 'Jadwal aktif', count: scheduled + pendingRequests },
      ],
      metrics: [
        {
          label: 'Target',
          value: treatmentGoal ? 'Aktif' : '—',
          percentage: treatmentGoal ? 100 : 0,
          barStyle: 'accent',
        },
        { label: 'Kehadiran', value: `${attendance}%`, percentage: attendance, barStyle: 'solid' },
        {
          label: 'Catatan',
          value: totalRecords,
          percentage: totalRecords ? 100 : 0,
          barStyle: 'tick',
        },
      ],
      listTitle: 'Catatan Pendukung Target',
      items: recentRecords,
      emptyMessage: 'Catatan perkembangan akan tampil setelah sesi pertama Anda.',
      listActionHref: '/dashboard/progress',
      listActionLabel: 'Rekam Medis',
    },
    kehadiran: {
      totalValue: `${attendance}%`,
      totalLabel: 'KEHADIRAN',
      context: eligibleSessions
        ? `${completed} dari ${eligibleSessions} sesi terlaksana`
        : 'Belum ada sesi yang dapat dihitung.',
      summaryTitle: 'Rekap Kehadiran',
      summaryTags: [
        { label: 'Hadir', count: completed },
        { label: 'Tidak hadir', count: noShow },
        { label: 'Terjadwal', count: scheduled },
      ],
      metrics: [
        { label: 'Kehadiran', value: `${attendance}%`, percentage: attendance, barStyle: 'solid' },
        { label: 'Sesi selesai', value: completed, percentage: completed ? 100 : 0, barStyle: 'accent' },
        { label: 'Jadwal aktif', value: scheduled, percentage: scheduled ? 100 : 0, barStyle: 'tick' },
      ],
      listTitle: 'Sesi Terakhir',
      items: sessionHistory,
      emptyMessage: 'Belum ada riwayat sesi terapi.',
      listActionHref: '/dashboard/appointments',
      listActionLabel: 'Jadwal',
    },
    aktivitas: {
      totalValue: totalRecords,
      totalLabel: 'AKTIVITAS',
      context: 'Jejak terbaru dari catatan, jadwal, dan pengajuan Anda.',
      summaryTitle: 'Jejak Aktivitas',
      summaryTags: [
        { label: 'Catatan medis', count: totalRecords },
        { label: 'Jadwal aktif', count: scheduled },
        { label: 'Pengajuan', count: pendingRequests },
      ],
      metrics: [
        {
          label: 'Catatan',
          value: totalRecords,
          percentage: totalRecords ? 100 : 0,
          barStyle: 'accent',
        },
        { label: 'Jadwal', value: appointments.length, percentage: appointments.length ? 100 : 0, barStyle: 'solid' },
        { label: 'Pengajuan', value: requests.length, percentage: requests.length ? 100 : 0, barStyle: 'tick' },
      ],
      listTitle: 'Aktivitas Terbaru',
      items: latestActivity,
      emptyMessage: 'Belum ada aktivitas terbaru.',
      listActionHref: '/dashboard/history',
      listActionLabel: 'Riwayat',
    },
  };

  const content = tabContent[activeTab];

  return (
    <FolderTabPanel
      tabs={TABS}
      activeTabId={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as HubTab)}
      totalValue={content.totalValue}
      totalLabel={content.totalLabel}
      context={content.context}
      summaryTitle={content.summaryTitle}
      summaryTags={content.summaryTags}
      metrics={content.metrics}
      listTitle={content.listTitle}
      listActionHref={content.listActionHref}
      listActionLabel={content.listActionLabel}
      items={content.items}
      emptyMessage={content.emptyMessage}
    />
  );
}
