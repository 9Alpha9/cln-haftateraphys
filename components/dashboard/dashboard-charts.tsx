'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck2, Activity, ClipboardList, CheckCircle2 } from 'lucide-react';
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
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Realtime · diperbarui otomatis
          {error ? <span className="ml-2 text-destructive">{error}</span> : null}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Appointment" value={stats.kpis.totalAppointments} icon={CalendarCheck2} />
        <StatCard label="Pasien Aktif" value={stats.kpis.activePatients} icon={Activity} />
        <StatCard label="Intake Menunggu" value={stats.kpis.submittedIntakes} icon={ClipboardList} />
        <StatCard label="Kasus Selesai" value={stats.kpis.completedCases} icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment per Hari (14 hari)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" width={28} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  name="Appointment"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pasien per Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientChart}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {patientChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment per Status</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appointmentChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9ca3af" width={28} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Appointment">
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

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Activity }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5">
          <Icon className="h-6 w-6 text-primary" />
        </span>
      </CardContent>
    </Card>
  );
}
