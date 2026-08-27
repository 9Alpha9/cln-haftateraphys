'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck2, Activity, ClipboardList, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/server/queries/dashboard-stats';

const STATUS_COLORS: Record<string, string> = {
  INTAKE: '#10b981',
  ACTIVE: '#2563eb',
  ON_HOLD: '#f59e0b',
  COMPLETED: '#6b7280',
  REFERRED: '#8b5cf6',
  ARCHIVED: '#d1d5db',
  SCHEDULED: '#2563eb',
  IN_PROGRESS: '#10b981',
  COMPLETED_BUSY: '#6b7280',
  CANCELLED: '#ef4444',
  RESCHEDULED: '#f59e0b',
  NO_SHOW: '#d1d5db',
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
    CANCELLED: 'Dibatalkan',
  };
  return map[value] ?? value;
}

export function DashboardCharts({ initialStats }: { initialStats: DashboardStats }) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Appointment"
          value={stats.kpis.totalAppointments}
          icon={CalendarCheck2}
          trend={12}
          trendLabel="minggu ini"
          color="blue"
        />
        <StatCard
          label="Pasien Aktif"
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
          trendLabel="vs kemarin"
          color="amber"
        />
        <StatCard
          label="Kasus Selesai"
          value={stats.kpis.completedCases}
          icon={CheckCircle2}
          trend={15}
          trendLabel=" bulan ini"
          color="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Appointment per Hari</CardTitle>
            <span className="text-xs text-muted-foreground">14 hari terakhir</span>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" width={28} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#trendFill)"
                  name="Appointment"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Pasien per Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientChart}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {patientChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Appointment per Status</CardTitle>
        </CardHeader>
        <CardContent className="h-64 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appointmentChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" width={28} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Appointment">
                {appointmentChart.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', chart: '#2563eb' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', chart: '#10b981' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', chart: '#f59e0b' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', chart: '#8b5cf6' },
} as const;

type ColorKey = keyof typeof COLOR_MAP;

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
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
    <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${colors.badge}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      </div>
      {trendLabel && (
        <p className="mt-1 text-xs text-muted-foreground">{trendLabel}</p>
      )}
    </div>
  );
}
