'use client';

import { useEffect, useState } from 'react';
import {
  CalendarCheck2,
  Activity,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { DashboardStats } from '@/server/queries/dashboard-stats';

const STATUS_COLORS: Record<string, string> = {
  INTAKE: '#f59e0b',
  ACTIVE: '#fbbf24',
  ON_HOLD: '#f97316',
  COMPLETED: '#ea580c',
  REFERRED: '#f59e0b',
  ARCHIVED: '#9ca3af',
  SCHEDULED: '#fbbf24',
  IN_PROGRESS: '#f59e0b',
  COMPLETED_BUSY: '#ea580c',
  CANCELLED: '#b91c1c',
  RESCHEDULED: '#f97316',
  NO_SHOW: '#9ca3af',
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

function labelOf(value: string): string {
  const map: Record<string, string> = {
    INTAKE: 'Intake',
    ACTIVE: 'Aktif',
    ON_HOLD: 'Ditunda',
    COMPLETED: 'Selesai',
    REFERRED: 'Rujuk',
    ARCHIVED: 'Arsip',
    SCHEDULED: 'Terjadwal',
    IN_PROGRESS: 'Berjalan',
    CANCELLED: 'Batal',
    RESCHEDULED: 'Reschedule',
    NO_SHOW: 'Absen',
  };
  return map[value] ?? value;
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
        if (active) {
          setStats(data);
          setError(null);
        }
      } catch {
        if (active) setError('Gagal memuat data real-time.');
      }
    }

    refresh();
    const id = window.setInterval(refresh, 10_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const patientChart = stats.patientsByStatus.map((r) => ({
    name: labelOf(r.status),
    value: r.count,
    color: STATUS_COLORS[r.status] ?? '#9ca3af',
  }));
  const appointmentChart = stats.appointmentsByStatus.map((r) => ({
    name: labelOf(r.status),
    value: r.count,
    color: STATUS_COLORS[r.status] ?? '#9ca3af',
  }));
  const trend = stats.appointmentsTrend;

  const isGlobal = role === 'SUPER_ADMIN' || role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={isGlobal ? "Total Janji Temu" : "Jadwal Saya"}
          value={stats.kpis.totalAppointments}
          icon={CalendarCheck2}
          trend={12}
          trendLabel="minggu ini"
          color="primary"
        />
        <StatCard
          label={isGlobal ? "Pasien Aktif" : "Pasien Terhubung"}
          value={stats.kpis.activePatients}
          icon={Activity}
          trend={8}
          trendLabel="bulan ini"
          color="emerald"
        />
        <StatCard
          label="Intake Menunggu"
          value={stats.kpis.submittedIntakes}
          icon={ClipboardList}
          trend={-3}
          trendLabel="vs minggu lalu"
          color="accent"
        />
        <StatCard
          label={isGlobal ? "Kasus Selesai (Klinik)" : "Kasus Saya Selesai"}
          value={stats.kpis.completedCases}
          icon={CheckCircle2}
          trend={15}
          trendLabel="bulan ini"
          color="sage"
        />
      </div>

      {/* Analytics Charts 3-Column Grid */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 items-stretch">
        {/* 1. Trend Area Chart */}
        <Card className="rounded-2xl border border-border/60 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-[#92400e]">
                  <LineChartIcon className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">Tren Janji Temu</CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    {isGlobal ? "Aktivitas operasional 14 hari terakhir" : "Aktivitas terapi Anda 14 hari terakhir"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-60 pt-2 px-1 sm:px-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={30}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#f59e0b' }}
                  activeDot={{ r: 4.5, strokeWidth: 2, stroke: '#ffffff' }}
                  fill="url(#trendFill)"
                  name="Janji Temu"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Patient Status Pie Chart */}
        <Card className="rounded-2xl border border-border/60 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-[#92400e]">
                <PieChartIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Status Pasien</CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  {isGlobal ? "Komposisi seluruh pasien klinik" : "Komposisi pasien penanganan Anda"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-60 pt-2">
            {patientChart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Belum ada data.</div>
            ) : (
              <div className="w-full h-full flex flex-col justify-between">
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={patientChart}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {patientChart.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '10px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                  {patientChart.map((item) => (
                    <div key={item.name} className="flex items-center justify-between px-2 py-1 rounded-md bg-slate-50">
                      <div className="flex items-center gap-1.5 truncate">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] font-medium text-slate-600 truncate">{item.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 ml-1">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Appointment by Status Bar Chart */}
        <Card className="rounded-2xl border border-border/60 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-[#92400e]">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Status Janji Temu</CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  {isGlobal ? "Distribusi sesi klinis keseluruhan" : "Distribusi sesi terapi Anda"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-60 pt-2 px-1 sm:px-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} width={30} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  contentStyle={{
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28} name="Jumlah">
                  {appointmentChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color !== '#9ca3af' ? entry.color : 'url(#barGradient)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const COLOR_MAP = {
  primary: {
    bg: 'bg-accent/15 text-[#92400e]',
    border: 'hover:border-accent/40',
    badge: 'bg-accent/15 text-[#92400e]',
  },
  emerald: {
    bg: 'bg-orange-100 text-[#92400e]',
    border: 'hover:border-orange-200',
    badge: 'bg-orange-100 text-[#92400e]',
  },
  sage: {
    bg: 'bg-amber-100 text-[#92400e]',
    border: 'hover:border-amber-200',
    badge: 'bg-amber-100 text-[#92400e]',
  },
  accent: {
    bg: 'bg-yellow-100 text-[#92400e]',
    border: 'hover:border-yellow-200',
    badge: 'bg-yellow-100 text-[#92400e]',
  },
} as const;

type ColorKey = keyof typeof COLOR_MAP;

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  trend?: number;
  trendLabel?: string;
  color?: ColorKey;
}) {
  const colors = COLOR_MAP[color];
  const isPositive = (trend ?? 0) >= 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-2xs transition-all duration-200 hover:shadow-md ${colors.border}`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.bg} shadow-2xs`}>
          <Icon className="h-5.5 w-5.5" />
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
      </div>
      {trendLabel && (
        <p className="mt-2 text-xs font-medium text-muted-foreground/80 flex items-center gap-1">
          <span>{trendLabel}</span>
        </p>
      )}
    </div>
  );
}



