'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CalendarCheck2,
  Activity,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { DashboardStats } from '@/server/queries/dashboard-stats';

// Warna per patient status — patuh 100% pada CSS Variables :root Hafta
const PATIENT_STATUS_COLORS: Record<string, string> = {
  INTAKE: 'var(--hafta-ble-500, #3365e7)',      // Pasien Baru / Portal
  ACTIVE: 'var(--hafta-ylw-200, #e3db00)',      // Dalam Terapi / Utama
  COMPLETED: 'var(--hafta-grn-500, #21891a)',   // Selesai
  REFERRED: '#8b5cf6',
  ON_HOLD: 'var(--hafta-org-400, #e7660f)',     // Menunggu / Ditunda
  ARCHIVED: '#9CA3AF',
};

// Warna per appointment status — patuh 100% pada CSS Variables :root Hafta
const APPT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'var(--hafta-ylw-200, #e3db00)',   // Terjadwal
  IN_PROGRESS: 'var(--hafta-grn-500, #21891a)', // Hadir
  CANCELLED: 'var(--hafta-red-500, #cb2b2b)',   // Dibatalkan
  NO_SHOW: '#94a3b8',
  COMPLETED: '#181700',                         // Selesai
  RESCHEDULED: 'var(--hafta-org-400, #e7660f)',
};

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function labelPatient(value: string): string {
  const map: Record<string, string> = {
    INTAKE: 'Baru',
    ACTIVE: 'Dalam Terapi',
    ON_HOLD: 'Ditunda',
    COMPLETED: 'Selesai',
    REFERRED: 'Rujukan',
    ARCHIVED: 'Arsip',
  };
  return map[value] ?? value;
}

function labelAppt(value: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'Terjadwal',
    IN_PROGRESS: 'Hadir',
    CANCELLED: 'Batal',
    NO_SHOW: 'Absen',
    COMPLETED: 'Selesai',
    RESCHEDULED: 'Jadwal Ulang',
  };
  return map[value] ?? value;
}

function SparklineChart({ data, color = 'var(--hafta-ylw-200)' }: { data: { day: string; count: number }[]; color?: string }) {
  if (data.length === 0) return null;
  const id = `spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <div className="h-9 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="count" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardCharts({ initialStats, role }: { initialStats: DashboardStats; role?: string }) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as DashboardStats;
        if (active) { setStats(data); setError(null); }
      } catch {
        if (active) setError('Gagal memuat data.');
      }
    }
    refresh();
    const id = window.setInterval(refresh, 10_000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  const patientChart = stats.patientsByStatus.map((r) => ({
    name: labelPatient(r.status),
    value: r.count,
    color: PATIENT_STATUS_COLORS[r.status] ?? '#9CA3AF',
  }));

  const appointmentChart = stats.appointmentsByStatus.map((r) => ({
    name: labelAppt(r.status),
    value: r.count,
    color: APPT_STATUS_COLORS[r.status] ?? '#9CA3AF',
  }));

  const trend = stats.appointmentsTrend;
  const isGlobal = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const patientTotal = Math.max(patientChart.reduce((s, c) => s + c.value, 0), 1);

  // 4 KPI cards dengan warna yang 100% konsisten ke tema Hafta
  const kpiCards = [
    {
      label: isGlobal ? 'Total Janji Temu' : 'Jadwal Saya',
      value: stats.kpis.totalAppointments,
      icon: CalendarCheck2,
      iconBg: 'bg-[var(--hafta-ylw-50)]',
      iconColor: 'text-[var(--hafta-ylw-950)]',
      trend: '+12%',
      trendUp: true,
      trendLabel: 'vs minggu lalu',
      sparkData: trend,
      sparkColor: '#e3db00',
      href: '/dashboard/appointments',
    },
    {
      label: isGlobal ? 'Pasien Aktif' : 'Pasien Terhubung',
      value: stats.kpis.activePatients,
      icon: Activity,
      iconBg: 'bg-[var(--hafta-grn-50)]',
      iconColor: 'text-[var(--hafta-grn-600)]',
      trend: '+5%',
      trendUp: true,
      trendLabel: 'dalam terapi',
      sparkData: trend.slice(-7),
      sparkColor: '#21891a',
      href: '/dashboard/patients',
    },
    {
      label: 'Intake Menunggu',
      value: stats.kpis.submittedIntakes,
      icon: ClipboardList,
      iconBg: 'bg-[var(--hafta-org-50)]',
      iconColor: 'text-[var(--hafta-org-600)]',
      trend: 'Perlu Asesmen',
      trendUp: false,
      trendLabel: 'status terkirim',
      sparkData: [] as { day: string; count: number }[],
      sparkColor: '#e7660f',
      href: '/dashboard/intake',
    },
    {
      label: isGlobal ? 'Kasus Selesai (Klinik)' : 'Kasus Saya Selesai',
      value: stats.kpis.completedCases,
      icon: CheckCircle2,
      iconBg: 'bg-[var(--hafta-ble-50)]',
      iconColor: 'text-[var(--hafta-ble-600)]',
      trend: 'Optimal',
      trendUp: true,
      trendLabel: 'bulan ini',
      sparkData: [] as { day: string; count: number }[],
      sparkColor: '#3365e7',
      href: '/dashboard/progress',
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── 4 KPI CARDS INTERAKTIF DENGAN HOVER FEEDBACK HALUS ── */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--hafta-ylw-200)] hover:shadow-md cursor-pointer"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs ${kpi.iconBg} ${kpi.iconColor}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-stone-300 transition-colors group-hover:text-[#181700]" />
              </div>

              <div className="mt-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 leading-tight">
                  {kpi.label}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="font-mono text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#181700] leading-none">
                    {kpi.value}
                  </p>
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-stone-600">
                    {kpi.trendUp ? <TrendingUp className="h-3 w-3 text-emerald-600" /> : <TrendingDown className="h-3 w-3 text-stone-400" />}
                    {kpi.trend}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-stone-400">{kpi.trendLabel}</p>
              </div>
            </div>

            {/* Sparkline mini */}
            {kpi.sparkData.length > 0 && (
              <div className="mt-2 pt-2 border-t border-stone-100">
                <SparklineChart data={kpi.sparkData} color={kpi.sparkColor} />
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* ── 3 CHARTS DALAM 1 BARIS (Tren 2-kolom, Donut 1-kolom, Bar 1-kolom) ── */}
      <div className="grid gap-3.5 grid-cols-1 lg:grid-cols-4 items-stretch">
        {/* Chart 1: Tren Janji Temu */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hafta-ylw-100)] text-[#181700] shadow-2xs">
                <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#181700] sm:text-sm">Tren Janji Temu</p>
                <p className="text-[11px] text-stone-500">
                  {isGlobal ? 'Aktivitas operasional klinik' : 'Aktivitas terapi Anda'}
                </p>
              </div>
            </div>
            <span className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-600">
              14 Hari Terakhir
            </span>
          </div>

          <div className="flex-1 min-h-[180px]">
            {trend.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[180px] text-xs text-stone-400">
                Belum ada data janji temu.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e3db00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e3db00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={22} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px' }}
                    itemStyle={{ color: '#181700', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#181700"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#e3db00', strokeWidth: 1, stroke: '#181700' }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#181700' }}
                    fill="url(#trendFill)"
                    name="Janji Temu"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Status Pasien (Donut) */}
        <div className="lg:col-span-1 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hafta-ble-50)] text-[var(--hafta-ble-600)] shadow-2xs">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-[#181700] sm:text-sm">Status Pasien</p>
              <p className="text-[11px] text-stone-500">Komposisi klinik</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[190px]">
            <div className="relative h-[110px] w-[110px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={patientChart.length > 0 ? patientChart : [{ name: 'Kosong', value: 1, color: '#E5E7EB' }]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={34}
                    outerRadius={52}
                    paddingAngle={patientChart.length > 1 ? 3 : 0}
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {(patientChart.length > 0 ? patientChart : [{ name: 'Kosong', value: 1, color: '#E5E7EB' }]).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-lg font-bold text-[#181700] leading-none">
                  {patientChart.reduce((s, c) => s + c.value, 0)}
                </span>
                <span className="text-[9px] text-stone-400 mt-0.5">Pasien</span>
              </div>
            </div>

            <div className="w-full space-y-1">
              {patientChart.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-stone-600 flex-1 truncate">{item.name}</span>
                  <span className="font-mono text-[11px] font-bold text-[#181700] shrink-0">
                    {item.value} <span className="font-normal text-stone-400">({Math.round((item.value / patientTotal) * 100)}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Status Janji Temu (Bar) */}
        <div className="lg:col-span-1 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-600)] shadow-2xs">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#181700] sm:text-sm">Status Sesi</p>
              <p className="text-[11px] text-stone-500">Distribusi jadwal</p>
            </div>
          </div>

          <div className="flex-1 min-h-[190px]">
            {appointmentChart.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[190px] text-xs text-stone-400">
                Belum ada data sesi.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentChart} margin={{ top: 5, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={22} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(241,245,249,0.5)' }}
                    contentStyle={{ borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #E5E7EB', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20} name="Jumlah">
                    {appointmentChart.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
