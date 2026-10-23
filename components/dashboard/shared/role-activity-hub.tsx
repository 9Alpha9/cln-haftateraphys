'use client';

import React, { useState } from 'react';
import {
  FolderTabPanel,
  type FolderTab,
  type FolderActivityItem,
  type FolderMetricItem,
  type FolderSummaryTag,
} from '@/components/ui/folder-tab-panel';
import type { ActivityView } from '@/server/queries/recent-activities';
import type { Role } from '@/lib/permissions/roles';

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins}m lalu`;
  if (diffHours < 24) return `${diffHours}j lalu`;
  if (diffDays < 7) return `${diffDays}h lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function getActivityTag(action: string): string {
  const tags: Record<string, string> = {
    'appointment.create': 'Janji Temu Baru',
    'appointment.cancel': 'Pembatalan Jadwal',
    'appointment.update': 'Perubahan Jadwal',
    'appointment.complete': 'Sesi Selesai',
    'progress.finalize': 'Finalisasi RM',
    'progress.create': 'Evaluasi Klinis',
    'progress.update': 'Pembaruan RM',
    'intake.submit': 'Form Intake',
    'intake.review': 'Peninjauan Intake',
    'intake.accept': 'Intake Diterima',
    'intake.reject': 'Intake Ditolak',
    'intake.request-revision': 'Revisi Intake',
    'assessment.create': 'Asesmen Klinis',
    'assessment.finalize': 'Finalisasi Asesmen',
    'session.create': 'Sesi Terapi',
    'session.finalize': 'Sesi Selesai',
    'patient.create': 'Pasien Baru',
    'patient.update': 'Pembaruan Data Pasien',
    'patient.program.complete': 'Program Selesai',
  };

  if (tags[action]) return tags[action];
  if (action.startsWith('appointment.')) return 'Aktivitas Jadwal';
  if (action.startsWith('progress.')) return 'Aktivitas Rekam Medis';
  if (action.startsWith('assessment.')) return 'Aktivitas Asesmen';
  if (action.startsWith('intake.')) return 'Aktivitas Intake';
  if (action.startsWith('patient.')) return 'Aktivitas Pasien';
  return 'Aktivitas Klinis';
}

function getActivityKind(action: string): string {
  if (action.includes('appointment')) return 'Jadwal';
  if (action.includes('progress') || action.includes('assessment')) return 'Medis';
  if (action.includes('intake')) return 'Intake';
  if (action.includes('patient')) return 'Pasien';
  return 'Sistem';
}

function distributePercentages(counts: number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return counts.map(() => 0);

  const raw = counts.map((count) => (count / total) * 100);
  const result = raw.map(Math.floor);
  let remainder = 100 - result.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let index = 0; index < remainder; index += 1) {
    result[order[index % order.length].index] += 1;
  }

  return result;
}

export function RoleActivityHub({
  activities,
  role = 'SUPER_ADMIN',
  userName,
  dateLabel,
}: {
  activities: ActivityView[];
  role?: Role;
  userName?: string;
  dateLabel?: string;
}) {
  const isTherapist = role === 'THERAPIST';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  // State Tab Aktif
  const [activeTabId, setActiveTabId] = useState<string>('all');

  // Tabs Definition
  const therapistTabs: FolderTab[] = [
    { id: 'all', label: 'Semua', count: activities.length },
    {
      id: 'appointment',
      label: 'Jadwal',
      count: activities.filter((a) => a.action.includes('appointment')).length,
    },
    {
      id: 'progress',
      label: 'RM',
      count: activities.filter(
        (a) => a.action.includes('progress') || a.action.includes('intake') || a.action.includes('assessment')
      ).length,
    },
  ];

  const adminTabs: FolderTab[] = [
    { id: 'all', label: 'Semua', count: activities.length },
    {
      id: 'clinical',
      label: 'Klinis',
      count: activities.filter(
        (a) =>
          a.action.includes('appointment') ||
          a.action.includes('assessment') ||
          a.action.includes('intake') ||
          a.action.includes('progress') ||
          a.action.includes('patient')
      ).length,
    },
    {
      id: 'system',
      label: 'Sistem',
      count: activities.filter(
        (a) =>
          a.action.includes('user') ||
          a.action.includes('role') ||
          a.action.includes('setting') ||
          a.action.includes('login') ||
          a.action.includes('logout')
      ).length,
    },
  ];

  const tabs = isTherapist ? therapistTabs : adminTabs;

  // Filter Aktivitas sesuai Tab
  const filteredActivities = activities.filter((act) => {
    if (isTherapist) {
      if (activeTabId === 'appointment') return act.action.includes('appointment');
      if (activeTabId === 'progress')
        return act.action.includes('progress') || act.action.includes('intake') || act.action.includes('assessment');
      return true;
    }

    if (activeTabId === 'clinical') {
      return (
        act.action.includes('appointment') ||
        act.action.includes('assessment') ||
        act.action.includes('intake') ||
        act.action.includes('progress') ||
        act.action.includes('patient')
      );
    }

    if (activeTabId === 'system') {
      return (
        act.action.includes('user') ||
        act.action.includes('role') ||
        act.action.includes('setting') ||
        act.action.includes('login') ||
        act.action.includes('logout')
      );
    }

    return true;
  });

  // Hitung metrik real aktivitas
  const apptCount = activities.filter((a) => a.action.includes('appointment')).length;
  const progressCount = activities.filter((a) => a.action.includes('progress') || a.action.includes('assessment')).length;
  const intakeCount = activities.filter((a) => a.action.includes('intake')).length;
  const cancelCount = activities.filter((a) => a.action === 'appointment.cancel').length;
  const clinicalCount = activities.filter(
    (a) =>
      a.action.includes('appointment') ||
      a.action.includes('assessment') ||
      a.action.includes('intake') ||
      a.action.includes('progress') ||
      a.action.includes('patient'),
  ).length;
  const systemCount = activities.filter(
    (a) =>
      a.action.includes('user') ||
      a.action.includes('role') ||
      a.action.includes('setting') ||
      a.action.includes('login') ||
      a.action.includes('logout'),
  ).length;
  const operationalCount = Math.max(0, activities.length - clinicalCount - systemCount);

  const therapistPercentages = distributePercentages([apptCount, progressCount, intakeCount]);
  const adminPercentages = distributePercentages([clinicalCount, systemCount, operationalCount]);

  const metrics: FolderMetricItem[] = isTherapist
    ? [
        {
          label: `Janji Temu (${apptCount})`,
          value: `${therapistPercentages[0] ?? 0}%`,
          percentage: therapistPercentages[0] ?? 0,
          barStyle: 'tick',
        },
        {
          label: `Catatan Medis (${progressCount})`,
          value: `${therapistPercentages[1] ?? 0}%`,
          percentage: therapistPercentages[1] ?? 0,
          barStyle: 'solid',
        },
        {
          label: `Form Intake (${intakeCount})`,
          value: `${therapistPercentages[2] ?? 0}%`,
          percentage: therapistPercentages[2] ?? 0,
          barStyle: 'accent',
        },
      ]
    : [
        {
          label: `Klinis (${clinicalCount})`,
          value: `${adminPercentages[0] ?? 0}%`,
          percentage: adminPercentages[0] ?? 0,
          barStyle: 'tick',
        },
        {
          label: `Sistem (${systemCount})`,
          value: `${adminPercentages[1] ?? 0}%`,
          percentage: adminPercentages[1] ?? 0,
          barStyle: 'solid',
        },
        {
          label: `Operasional (${operationalCount})`,
          value: `${adminPercentages[2] ?? 0}%`,
          percentage: adminPercentages[2] ?? 0,
          barStyle: 'accent',
        },
      ];

  const summaryTags: FolderSummaryTag[] = isTherapist
    ? [
        { label: 'Janji Temu', count: apptCount },
        { label: 'Evaluasi RM', count: progressCount },
        { label: 'Batal Jadwal', count: cancelCount },
        { label: 'Form Intake', count: intakeCount },
      ]
    : [
        { label: 'Klinis', count: clinicalCount },
        { label: 'Sistem', count: systemCount },
        { label: 'Operasional', count: operationalCount },
        { label: 'Total Log', count: activities.length },
      ];

  // Map activities to folder items
  const items: FolderActivityItem[] = filteredActivities.slice(0, 5).map((act) => ({
    id: act.id,
    title: act.description,
    subtitle: act.actorName ? `Oleh: ${act.actorName}` : 'Sistem Klinis',
    time: getTimeAgo(new Date(act.createdAt)),
    kind: getActivityKind(act.action),
  }));

  const listTitle = isTherapist
    ? activeTabId === 'appointment'
      ? 'Jadwal Terbaru'
      : activeTabId === 'progress'
        ? 'Catatan Klinis Terbaru'
        : 'Tindakan Klinis Terbaru'
    : activeTabId === 'clinical'
      ? 'Aktivitas Klinis Terbaru'
      : activeTabId === 'system'
        ? 'Aktivitas Sistem Terbaru'
        : 'Riwayat Aktivitas Terbaru';

  return (
    <FolderTabPanel
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={setActiveTabId}
      totalValue={activities.length}
      totalLabel={isTherapist ? 'Log Klinis' : 'Aktivitas'}
      context={[dateLabel, userName].filter(Boolean).join(' · ')}
      summaryVisible={activeTabId === 'all'}
      summaryTitle={isTherapist ? 'Ringkasan Aktivitas Terapi' : 'Ringkasan Aktivitas Sistem'}
      summaryTags={summaryTags}
      metrics={metrics}
      listTitle={listTitle}
      listActionHref={isAdmin ? '/dashboard/audit-logs' : '/dashboard/progress'}
      listActionLabel={isAdmin ? 'Lihat Semua' : 'Rekam Medis'}
      items={items}
      emptyMessage="Belum ada catatan aktivitas pada kategori ini."
    />
  );
}
