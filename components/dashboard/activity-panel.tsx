'use client';

import React, { useState } from 'react';
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
  UserCheck,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import type { ActivityView } from '@/server/queries/recent-activities';
import type { Role } from '@/lib/permissions/roles';
import { cn } from '@/lib/utils';

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

function getActivityIcon(action: string) {
  if (action.includes('login')) return <LogIn className="h-4 w-4" />;
  if (action.includes('logout')) return <LogOut className="h-4 w-4" />;
  if (action.includes('user.create') || action.includes('patient.create')) return <UserPlus className="h-4 w-4" />;
  if (action.includes('intake')) return <ClipboardList className="h-4 w-4" />;
  if (action.includes('appointment')) return <CalendarDays className="h-4 w-4" />;
  if (action.includes('assessment') || action.includes('session') || action.includes('progress')) return <Activity className="h-4 w-4" />;
  if (action.includes('document')) return <FileText className="h-4 w-4" />;
  if (action.includes('upload')) return <Upload className="h-4 w-4" />;
  if (action.includes('settings') || action.includes('role')) return <Settings className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

function getActivityColor(action: string): string {
  if (action.includes('login') || action.includes('logout')) return 'bg-stone-100 text-stone-600';
  if (action.includes('appointment')) return 'bg-[var(--hafta-ylw-50)] text-[var(--hafta-ylw-900)]';
  if (action.includes('assessment') || action.includes('intake') || action.includes('progress')) return 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]';
  if (action.includes('user') || action.includes('patient')) return 'bg-[var(--hafta-ble-50)] text-[var(--hafta-ble-600)]';
  if (action.includes('delete') || action.includes('cancel')) return 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-600)]';
  return 'bg-stone-100 text-stone-700';
}

export function ActivityPanel({
  activities,
  role = 'SUPER_ADMIN',
}: {
  activities: ActivityView[];
  role?: Role;
}) {
  const isTherapist = role === 'THERAPIST';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  // State tab
  const [adminTab, setAdminTab] = useState<'all' | 'clinical' | 'system'>('all');
  const [therapistTab, setTherapistTab] = useState<'all' | 'appointment' | 'progress'>('all');

  // Filter items based on active tab
  const filtered = activities.filter((act) => {
    if (isTherapist) {
      if (therapistTab === 'appointment') return act.action.includes('appointment');
      if (therapistTab === 'progress') return act.action.includes('progress') || act.action.includes('intake') || act.action.includes('assessment');
      return true;
    }

    if (adminTab === 'clinical') {
      return (
        act.action.includes('appointment') ||
        act.action.includes('assessment') ||
        act.action.includes('intake') ||
        act.action.includes('progress') ||
        act.action.includes('patient')
      );
    }
    if (adminTab === 'system') {
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

  return (
    <div className="space-y-4">
      {/* ── CARD 1: AKTIVITAS TERBARU DENGAN FILTER TAB SESUAI ROLE ── */}
      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-sm overflow-hidden">
        {/* Header Panel */}
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--hafta-ylw-50)] text-[var(--hafta-ylw-900)]">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-[#181700]">
                {isTherapist ? 'Aktivitas Terapi' : 'Aktivitas Sistem'}
              </h3>
            </div>

            {/* Link kanan atas diarahkan sesuai role */}
            {isAdmin ? (
              <Link
                href="/dashboard/audit-logs"
                className="text-xs font-semibold text-stone-500 hover:text-[#181700] transition-colors"
              >
                Lihat Audit &rarr;
              </Link>
            ) : isTherapist ? (
              <Link
                href="/dashboard/progress"
                className="text-xs font-semibold text-stone-500 hover:text-[#181700] transition-colors"
              >
                Rekam Medis &rarr;
              </Link>
            ) : (
              <Link
                href="/dashboard/appointments"
                className="text-xs font-semibold text-stone-500 hover:text-[#181700] transition-colors"
              >
                Jadwal &rarr;
              </Link>
            )}
          </div>

          {/* Filter Tabs Dinamis Sesuai Role */}
          {isTherapist ? (
            <div className="mt-3 flex gap-1 rounded-xl bg-stone-100/80 p-1">
              <button
                type="button"
                onClick={() => setTherapistTab('all')}
                className={cn(
                  'flex-1 rounded-lg py-1 text-center font-semibold text-xs transition-all cursor-pointer',
                  therapistTab === 'all'
                    ? 'bg-white text-[#181700] shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                )}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTherapistTab('appointment')}
                className={cn(
                  'flex-1 rounded-lg py-1 text-center font-semibold text-xs transition-all cursor-pointer',
                  therapistTab === 'appointment'
                    ? 'bg-white text-[#181700] shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                )}
              >
                Jadwal
              </button>
              <button
                type="button"
                onClick={() => setTherapistTab('progress')}
                className={cn(
                  'flex-1 rounded-lg py-1 text-center font-semibold text-xs transition-all cursor-pointer',
                  therapistTab === 'progress'
                    ? 'bg-white text-[#181700] shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                )}
              >
                Rekam Medis
              </button>
            </div>
          ) : (
            <div className="mt-3 flex gap-1 rounded-xl bg-stone-100/80 p-1">
              <button
                type="button"
                onClick={() => setAdminTab('all')}
                className={cn(
                  'flex-1 rounded-lg py-1 text-center font-semibold text-xs transition-all cursor-pointer',
                  adminTab === 'all'
                    ? 'bg-white text-[#181700] shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                )}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('clinical')}
                className={cn(
                  'flex-1 rounded-lg py-1 text-center font-semibold text-xs transition-all cursor-pointer',
                  adminTab === 'clinical'
                    ? 'bg-white text-[#181700] shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                )}
              >
                Klinis
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('system')}
                className={cn(
                  'flex-1 rounded-lg py-1 text-center font-semibold text-xs transition-all cursor-pointer',
                  adminTab === 'system'
                    ? 'bg-white text-[#181700] shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                )}
              >
                Sistem
              </button>
            </div>
          )}
        </div>

        {/* List Aktivitas */}
        <div className="divide-y divide-stone-100 max-h-[360px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center px-4">
              <p className="text-xs font-medium text-stone-400">Tidak ada riwayat aktivitas pada kategori ini.</p>
            </div>
          ) : (
            filtered.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3.5 hover:bg-stone-50/70 transition-colors">
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs', getActivityColor(activity.action))}>
                  {getActivityIcon(activity.action)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#181700] leading-snug line-clamp-1">
                    {activity.description}
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone-500 truncate">
                    Oleh: {activity.actorName || 'Sistem'}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-stone-400 shrink-0">
                  {getTimeAgo(new Date(activity.createdAt))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── CARD 2: STATUS OPERASIONAL KLINIK HARI INI ── */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Operasional Hari Ini
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Aktif
          </span>
        </div>

        <div className="mt-3 space-y-2.5 text-xs text-stone-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[var(--hafta-ylw-900)]" />
              Sesi 1-on-1 Klinik
            </span>
            <span className="font-bold text-[#181700]">Tersedia</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Patient Portal Sync
            </span>
            <span className="font-mono text-xs font-bold text-emerald-700">Online</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100">
          <Link
            href="/dashboard/appointments"
            className="flex items-center justify-between text-xs font-bold text-[#181700] hover:text-stone-700 transition-colors"
          >
            <span>Buka Kalender Jadwal</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
