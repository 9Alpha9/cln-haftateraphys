'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  CalendarCheck2,
  Activity,
  Users,
} from 'lucide-react';
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
import type { DashboardStats } from '@/server/queries/dashboard-stats';
import { cn } from '@/lib/utils';

type RangeOption = '7d' | '14d' | '30d';

export function TherapistAnalyticsBento({
  stats,
  isTherapist = true,
}: {
  stats: DashboardStats;
  isTherapist?: boolean;
}) {
  const [range, setRange] = useState<RangeOption>('14d');

  // Trend data slice according to range
  const fullTrend = stats.appointmentsTrend;
  const trendData = range === '7d' ? fullTrend.slice(-7) : fullTrend;

  // Status mapping
  const statusColors: Record<string, string> = {
    INTAKE: 'var(--hafta-ylw-950, #181700)',
    ACTIVE: 'var(--hafta-ylw-200, #e3db00)',
    COMPLETED: '#181700',
    ON_HOLD: 'var(--hafta-org-400, #e7660f)',
    SCHEDULED: 'var(--hafta-ylw-200, #e3db00)',
    IN_PROGRESS: 'var(--hafta-grn-500, #21891a)',
    CANCELLED: 'var(--hafta-red-500, #cb2b2b)',
  };

  const patientPieData = stats.patientsByStatus.map((p) => ({
    name: p.status === 'INTAKE' ? 'Baru / Intake' : p.status === 'ACTIVE' ? 'Dalam Terapi' : p.status === 'COMPLETED' ? 'Selesai' : p.status,
    value: p.count,
    color: statusColors[p.status] ?? '#A8A29E',
  }));

  const totalPatients = Math.max(1, patientPieData.reduce((a, b) => a + b.value, 0));

  const apptBarData = stats.appointmentsByStatus.map((a) => ({
    name: a.status === 'SCHEDULED' ? 'Terjadwal' : a.status === 'IN_PROGRESS' ? 'Berjalan' : a.status === 'COMPLETED' ? 'Selesai' : 'Batal',
    value: a.count,
    color: statusColors[a.status] ?? '#A8A29E',
  }));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
      {/* ── 1. GRAFIK UTAMA: TREN SESI & EVALUASI KLINIS (7 KOLOM) ── */}
      <div className="lg:col-span-7 rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        {/* Header Baris Atas */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[#181700]">
              <TrendingUp className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#181700]">
                {isTherapist ? 'Tren Sesi & Rekam Medis' : 'Tren Aktivitas Operasional'}
              </h3>
              <p className="text-xs text-stone-500">
                Aktivitas pendampingan terapi dan pencatatan perkembangan
              </p>
            </div>
          </div>

          {/* Time-Range Switcher */}
          <div className="flex items-center gap-1 rounded-full bg-stone-100/90 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setRange('7d')}
              className={cn(
                'rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer',
                range === '7d' ? 'bg-white text-[#181700] shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              )}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setRange('14d')}
              className={cn(
                'rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer',
                range === '14d' ? 'bg-white text-[#181700] shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              )}
            >
              14 Hari
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--hafta-ylw-200)]" />
            <span className="font-semibold text-stone-700">Janji Temu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#181700]" />
            <span className="font-semibold text-stone-700">Evaluasi Rekam Medis</span>
          </div>
        </div>

        {/* Chart View */}
        <div className="mt-3 flex-1 min-h-[200px]">
          {trendData.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center text-xs text-stone-400">
              Belum ada riwayat aktivitas pada rentang ini.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendApptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e3db00" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#e3db00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#78716c' }} width={24} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    backgroundColor: '#fff',
                    border: '1px solid #E7E5E4',
                    boxShadow: '0 8px 24px rgba(24,23,0,0.08)',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#181700', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#e3db00"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#e3db00', strokeWidth: 1, stroke: '#181700' }}
                  fill="url(#trendApptGrad)"
                  name="Janji Temu"
                />
                <Area
                  type="monotone"
                  dataKey="progressCount"
                  stroke="#181700"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#181700', strokeWidth: 0 }}
                  fill="none"
                  name="Evaluasi RM"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── 2. STATUS PASIEN & DISTRIBUSI SESI (5 KOLOM BENTO) ── */}
      <div className="lg:col-span-5 rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[#181700]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#181700]">Status Pasien &amp; Sesi</h3>
              <p className="text-xs text-stone-500">Komposisi penanganan pasien terapis</p>
            </div>
          </div>
        </div>

        {/* Donut Chart & Distribution Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-5 flex-1">
          {/* Donut Chart */}
          <div className="relative h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientPieData.length > 0 ? patientPieData : [{ name: 'Belum Ada', value: 1, color: '#E7E5E4' }]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={36}
                  outerRadius={54}
                  paddingAngle={patientPieData.length > 1 ? 4 : 0}
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {(patientPieData.length > 0 ? patientPieData : [{ name: 'Belum Ada', value: 1, color: '#E7E5E4' }]).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono text-xl font-extrabold text-[#181700] leading-none">
                {patientPieData.reduce((a, b) => a + b.value, 0)}
              </span>
              <span className="text-[9px] font-bold text-stone-400 mt-0.5">Pasien</span>
            </div>
          </div>

          {/* Legenda Pasien */}
          <div className="w-full sm:flex-1 space-y-1.5">
            {patientPieData.length === 0 ? (
              <p className="text-xs text-stone-400">Belum ada pasien terhubung.</p>
            ) : (
              patientPieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-stone-600 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-[#181700]">
                    {item.value}{' '}
                    <span className="font-normal text-stone-400 text-[10px]">
                      ({Math.round((item.value / totalPatients) * 100)}%)
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mini Distribution Bar for Appointments */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-[#181700]">Distribusi Status Sesi</span>
            <span className="text-[11px] text-stone-500 font-mono">
              {apptBarData.reduce((a, b) => a + b.value, 0)} Total Sesi
            </span>
          </div>

          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-stone-100 gap-0.5">
            {apptBarData.map((b) => (
              <div
                key={b.name}
                title={`${b.name}: ${b.value}`}
                className="h-full transition-all"
                style={{
                  width: `${Math.max(8, (b.value / Math.max(1, apptBarData.reduce((a, x) => a + x.value, 0))) * 100)}%`,
                  backgroundColor: b.color,
                }}
              />
            ))}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-600">
            {apptBarData.map((b) => (
              <div key={b.name} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                <span>
                  {b.name} ({b.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
