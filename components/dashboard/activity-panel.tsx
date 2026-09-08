'use client';


import Link from 'next/link';

import {
  UserPlus,
  ClipboardList,
  CalendarDays,
  Activity,
  FileText,
  Settings,
  LogIn,
  LogOut,
  Upload,
  ArrowRight,
} from 'lucide-react';
import type { ActivityView } from '@/server/queries/recent-activities';

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function getActivityIcon(action: string) {
  if (action.includes('login')) return <LogIn className="h-4 w-4" />;
  if (action.includes('logout')) return <LogOut className="h-4 w-4" />;
  if (action.includes('user.create') || action.includes('patient.create')) return <UserPlus className="h-4 w-4" />;
  if (action.includes('intake')) return <ClipboardList className="h-4 w-4" />;
  if (action.includes('appointment')) return <CalendarDays className="h-4 w-4" />;
  if (action.includes('assessment') || action.includes('session')) return <Activity className="h-4 w-4" />;
  if (action.includes('document')) return <FileText className="h-4 w-4" />;
  if (action.includes('upload')) return <Upload className="h-4 w-4" />;
  if (action.includes('settings')) return <Settings className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

function getActivityColor(action: string): string {
  if (action.includes('login') || action.includes('logout')) return 'bg-[#F1F5F9] text-[#6B7280]';
  if (action.includes('create')) return 'bg-[#F0FDF4] text-[#16a34a]';
  if (action.includes('update')) return 'bg-[var(--hafta-ylw-50)] text-hafta-ylw-600';
  if (action.includes('delete') || action.includes('cancel')) return 'bg-[#FEF2F2] text-[#dc2626]';
  if (action.includes('submit') || action.includes('accept')) return 'bg-[#F0FDF4] text-[#16a34a]';
  if (action.includes('upload')) return 'bg-[#F0F9FF] text-[#3b82f6]';
  return 'bg-[var(--hafta-ylw-50)] text-hafta-ylw-600';
}

function getActivityTitle(activity: ActivityView): string {
  const action = activity.action;
  if (action.includes('appointment.create')) return 'Janji temu baru dibuat';
  if (action.includes('appointment.update')) return 'Janji temu diperbarui';
  if (action.includes('assessment.update') || action.includes('assessment.create')) return 'Rekam medis diperbarui';
  if (action.includes('intake.create')) return 'Intake pasien baru';
  if (action.includes('document.upload')) return 'Dokumen diunggah';
  if (action.includes('user.login')) return 'Pengguna login';
  if (action.includes('user.create')) return 'Pengguna baru dibuat';
  return activity.description;
}

function getActivitySubtitle(activity: ActivityView): string {
  const action = activity.action;
  if (action.includes('appointment')) return `Pasien: ${activity.actorName || '-'}`;
  if (action.includes('assessment')) return `Pasien: ${activity.actorName || '-'}`;
  if (action.includes('intake')) return `Pasien: ${activity.actorName || '-'}`;
  if (action.includes('document')) return `Laporan Terapi - ${new Date(activity.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
  if (action.includes('user.login')) return activity.actorName || 'User';
  return activity.actorName || '';
}

export function ActivityPanel({ activities }: { activities: ActivityView[] }) {
  return (
    <div className="space-y-4">
      {/* Activity List */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--hafta-ylw-50)] text-hafta-ylw-600">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[13px] font-bold text-[#111827]">Aktivitas Terbaru</h3>
          </div>
          <Link
            href="/dashboard/audit-logs"
            className="text-[11px] font-semibold text-hafta-ylw-800 hover:text-hafta-ylw-900 transition-colors"
          >
            Lihat Semua
          </Link>
        </div>

        {/* Items */}
        <div className="divide-y divide-[#F9FAFB]">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Activity className="h-8 w-8 text-[#E5E7EB]" />
              <p className="mt-2 text-[11px] font-medium text-[#9CA3AF]">Belum ada aktivitas terbaru</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${getActivityColor(activity.action)}`}>
                  {getActivityIcon(activity.action)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-[#111827] leading-snug">
                    {getActivityTitle(activity)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9CA3AF] truncate">
                    {getActivitySubtitle(activity)}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-[#C4B5A0] whitespace-nowrap shrink-0 mt-0.5">
                  {new Date(activity.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Promo Card */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-ylw-50)]">
            <CalendarDays className="h-6 w-6 text-hafta-ylw-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[12px] font-bold text-[#111827] leading-snug">
              Kelola jadwal terapi<br />dengan lebih mudah
            </h4>
            <p className="mt-1 text-[11px] text-[#9CA3AF] leading-relaxed">
              Atur janji temu, pantau pasien, dan tingkatkan efisiensi klinik Anda.
            </p>
            <Link
              href="/dashboard/appointments"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-hafta-ylw-800 hover:text-hafta-ylw-900 transition-colors"
            >
              Pelajari lebih lanjut <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


