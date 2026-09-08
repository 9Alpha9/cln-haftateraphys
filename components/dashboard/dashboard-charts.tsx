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

// Warna per patient status — sesuai referensi (Baru=biru, Dalam Terapi=amber, Selesai=hijau, Rujukan=ungu)
const PATIENT_STATUS_COLORS: Record<string, string> = {
  INTAKE: '#3b82f6',
  ACTIVE: 'var(--hafta-ylw-200)',
  COMPLETED: '#16a34a',
  REFERRED: '#8b5cf6',
  ON_HOLD: '#f97316',
  ARCHIVED: '#9CA3AF',
};

// Warna per appointment status — sesuai referensi bar chart
const APPT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'var(--hafta-ylw-200)',
  IN_PROGRESS: '#22c55e',
  CANCELLED: '#f87171',
  NO_SHOW: '#94a3b8',
  COMPLETED: '#a78bfa',
  RESCHEDULED: '#f97316',
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
    CANCELLED: 'Dibatalkan',
    NO_SHOW: 'Tidak Hadir',
    COMPLETED: 'Selesai',
    RESCHEDULED: 'Reschedule',
  };
  return map[value] ?? value;
}

function SparklineChart({ data, color = 'var(--hafta-ylw-200)' }: { data: { day: string; count: number }[]; color?: string }) {
  if (data.length === 0) return null;
  const id = `spark-${color.replace('#', '')}`;
  return (
    <div className="h-10 w-full">
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

  // KPI cards — icon berbeda warna sesuai referensi
  const kpiCards = [
    {
      label: isGlobal ? 'Total Janji Temu' : 'Jadwal Saya',
      value: stats.kpis.totalAppointments,
      icon: CalendarCheck2,
      iconBg: 'bg-[var(--hafta-ylw-50)]',
       iconColor: 'text-hafta-ylw-700',
      trend: '+12%',
      trendUp: true,
      trendLabel: 'vs minggu lalu',
      sparkData: trend,
      sparkColor: 'var(--hafta-ylw-200)',
      href: '/dashboard/appointments',
    },
    {
      label: isGlobal ? 'Pasien Aktif' : 'Pasien Terhubung',
      value: stats.kpis.activePatients,
      icon: Activity,
      iconBg: 'bg-[#FFF0F0]',
      iconColor: 'text-[#f87171]',
      trend: '-0%',
      trendUp: false,
      trendLabel: 'vs minggu lalu',
      sparkData: [] as { day: string; count: number }[],
      sparkColor: '#f87171',
      href: '/dashboard/patients',
    },
    {
      label: 'Intake Menunggu',
      value: stats.kpis.submittedIntakes,
      icon: ClipboardList,
      iconBg: 'bg-[#EEF2FF]',
      iconColor: 'text-[#818cf8]',
      trend: '-0%',
      trendUp: false,
      trendLabel: 'vs minggu lalu',
      sparkData: [] as { day: string; count: number }[],
      sparkColor: '#818cf8',
      href: '/dashboard/intake',
    },
    {
      label: isGlobal ? 'Kasus Selesai (Klinik)' : 'Kasus Saya Selesai',
      value: stats.kpis.completedCases,
      icon: CheckCircle2,
      iconBg: 'bg-[#F0FDF4]',
      iconColor: 'text-[#22c55e]',
      trend: '-0%',
      trendUp: false,
      trendLabel: 'bulan ini',
      sparkData: [] as { day: string; count: number }[],
      sparkColor: '#22c55e',
      href: '/dashboard/progress',
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── 4 KPI Cards ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--hafta-ylw-200)]/40"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.iconBg} ${kpi.iconColor}`}>
                <kpi.icon className="h-[18px] w-[18px]" />
              </div>
              <ChevronRight className="h-4 w-4 text-[#D1D5DB] transition-colors group-hover:text-[var(--hafta-ylw-200)]" />
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-medium text-[#94a3b8] leading-tight">{kpi.label}</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <p className="text-[28px] font-bold tracking-tight text-[#1E293B] leading-none">{kpi.value}</p>
                <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${kpi.trendUp ? 'text-[#22c55e]' : 'text-[#94a3b8]'}`}>
                  {kpi.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.trend}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-[#94a3b8]">{kpi.trendLabel}</p>
            </div>
            <div className="mt-3">
              <SparklineChart data={kpi.sparkData} color={kpi.sparkColor} />
            </div>
          </Link>
        ))}
      </div>

      {/* ── 3 Charts dalam 1 baris — grid 4 kolom (Tren=2, Donut=1, Bar=1) ── */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-4 items-stretch">

        {/* Chart 1: Tren Janji Temu — col-span-2 */}
        <div className="lg:col-span-2 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hafta-ylw-50)] text-hafta-ylw-700">
                <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1E293B]">Tren Janji Temu</p>
                <p className="text-[11px] text-[#94a3b8]">
                  {isGlobal ? 'Aktivitas operasional' : 'Aktivitas terapi Anda'}
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-[11px] font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap">
              14 Hari Terakhir <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 min-h-[180px]">
            {trend.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[180px] text-[12px] text-[#94a3b8]">
                Belum ada data janji temu.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--hafta-ylw-200)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--hafta-ylw-200)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={22} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                    itemStyle={{ color: '#1E293B', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--hafta-ylw-200)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--hafta-ylw-200)', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: 'var(--hafta-ylw-200)' }}
                    fill="url(#trendFill)"
                    name="Janji Temu"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Status Pasien (Donut) — col-span-1 */}
        <div className="lg:col-span-1 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hafta-ylw-50)] text-hafta-ylw-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1E293B]">Status Pasien</p>
              <p className="text-[11px] text-[#94a3b8]">
                {isGlobal ? 'Komposisi seluruh pasien klinik' : 'Pasien penanganan Anda'}
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            {/* Donut chart */}
            <div className="relative h-[120px] w-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={patientChart.length > 0 ? patientChart : [{ name: 'Kosong', value: 1, color: '#E5E7EB' }]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={patientChart.length > 1 ? 3 : 0}
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {(patientChart.length > 0 ? patientChart : [{ name: 'Kosong', value: 1, color: '#E5E7EB' }]).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  {patientChart.length > 0 && (
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[20px] font-bold text-[#1E293B] leading-none">
                  {patientChart.reduce((s, c) => s + c.value, 0)}
                </span>
                <span className="text-[9px] text-[#94a3b8] mt-0.5">Total Pasien</span>
              </div>
            </div>
            {/* Legend */}
            <div className="w-full space-y-1">
              {patientChart.length === 0 ? (
                <p className="text-center text-[11px] text-[#94a3b8]">Belum ada data pasien.</p>
              ) : (
                patientChart.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-[#64748B] flex-1 truncate">{item.name}</span>
                    <span className="text-[11px] font-semibold text-[#1E293B] shrink-0">
                      {item.value}
                      <span className="ml-1 font-normal text-[#94a3b8]">({Math.round(item.value / patientTotal * 100)}%)</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chart 3: Status Janji Temu (Bar) — col-span-1 */}
        <div className="lg:col-span-1 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hafta-ylw-50)] text-hafta-ylw-700">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1E293B]">Status Janji Temu</p>
              <p className="text-[11px] text-[#94a3b8]">
                {isGlobal ? 'Distribusi sesi klinis keseluruhan' : 'Distribusi sesi terapi Anda'}
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            {appointmentChart.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-[12px] text-[#94a3b8]">
                Belum ada data janji temu.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentChart} margin={{ top: 5, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={22} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(241,245,249,0.6)' }}
                    contentStyle={{ borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24} name="Jumlah">
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

