"use client";

import { useUserRole } from "@/hooks/use-user-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, ClipboardCheck, FileText, Activity, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "THERAPIST", "STAFF"];

const patientChartConfig = {
  pasien: {
    label: "Pasien Baru",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const intakeChartConfig = {
  pending: {
    label: "Menunggu",
    color: "hsl(45, 93%, 47%)",
  },
  reviewed: {
    label: "Ditinjau",
    color: "hsl(142, 71%, 45%)",
  },
  rejected: {
    label: "Ditolak",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

const sessionChartConfig = {
  selesai: {
    label: "Selesai",
    color: "hsl(142, 71%, 45%)",
  },
  terjadwal: {
    label: "Terjadwal",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const patientMonthlyData = [
  { bulan: "Jan", pasien: 4 },
  { bulan: "Feb", pasien: 7 },
  { bulan: "Mar", pasien: 5 },
  { bulan: "Apr", pasien: 10 },
  { bulan: "Mei", pasien: 8 },
  { bulan: "Jun", pasien: 12 },
];

const intakeStatusData = [
  { name: "Menunggu", value: 3, fill: "hsl(45, 93%, 47%)" },
  { name: "Ditinjau", value: 5, fill: "hsl(142, 71%, 45%)" },
  { name: "Ditolak", value: 1, fill: "hsl(0, 84%, 60%)" },
];

const sessionWeeklyData = [
  { hari: "Sen", selesai: 4, terjadwal: 6 },
  { hari: "Sel", selesai: 3, terjadwal: 5 },
  { hari: "Rab", selesai: 6, terjadwal: 4 },
  { hari: "Kam", selesai: 5, terjadwal: 7 },
  { hari: "Jum", selesai: 2, terjadwal: 3 },
];

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="text-muted-foreground">
          Kelola pasien dan workflow klinis
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pasien</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">46</div>
            <p className="text-xs text-muted-foreground">
              +12 bulan ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Intake Review</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Menunggu review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Draft Assessment</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Perlu diselesaikan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sesi Hari Ini</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              3 selesai, 2 terjadwal
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pasien Baru per Bulan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={patientChartConfig} className="h-[250px]">
              <BarChart data={patientMonthlyData}>
                <XAxis dataKey="bulan" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pasien" fill="var(--color-pasien)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Status Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={intakeChartConfig} className="h-[250px]">
              <PieChart>
                <Pie
                  data={intakeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {intakeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sesi Terapi Minggu Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={sessionChartConfig} className="h-[250px]">
            <LineChart data={sessionWeeklyData}>
              <XAxis dataKey="hari" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="selesai" stroke="var(--color-selesai)" strokeWidth={2} dot={{ fill: "var(--color-selesai)" }} />
              <Line type="monotone" dataKey="terjadwal" stroke="var(--color-terjadwal)" strokeWidth={2} dot={{ fill: "var(--color-terjadwal)" }} strokeDasharray="5 5" />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Akses Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/dashboard/patients"
                className="flex items-center gap-3 rounded-md p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                Daftar Pasien
              </Link>
              <Link
                href="/dashboard/users"
                className="flex items-center gap-3 rounded-md p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                Manajemen Pengguna
              </Link>
              <Link
                href="/dashboard/audit-logs"
                className="flex items-center gap-3 rounded-md p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Log Audit
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Intake diterima</p>
                  <p className="text-xs text-muted-foreground">Budi Santoso - 2 jam lalu</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium">Sesi terapi selesai</p>
                  <p className="text-xs text-muted-foreground">Siti Aminah - 4 jam lalu</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500" />
                <div>
                  <p className="text-sm font-medium">Assessment baru</p>
                  <p className="text-xs text-muted-foreground">Ahmad Rizki - kemarin</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const treatmentProgressData = [
  { minggu: "M1", skor: 30 },
  { minggu: "M2", skor: 45 },
  { minggu: "M3", skor: 55 },
  { minggu: "M4", skor: 70 },
  { minggu: "M5", skor: 80 },
  { minggu: "M6", skor: 85 },
];

const treatmentChartConfig = {
  skor: {
    label: "Skor Pemulihan",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

function PatientDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ringkasan</h1>
        <p className="text-muted-foreground">
          Pantau perkembangan terapi Anda
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sesi Berikutnya</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Kam</div>
            <p className="text-xs text-muted-foreground">
              14 Agustus 2026, 10:00 WIB
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sesi</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              6 selesai, 6 tersisa
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Skor Pemulihan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-emerald-600">
              +15% dari minggu lalu
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress Pemulihan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={treatmentChartConfig} className="h-[250px]">
            <LineChart data={treatmentProgressData}>
              <XAxis dataKey="minggu" />
              <YAxis domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="skor" stroke="var(--color-skor)" strokeWidth={2} dot={{ fill: "var(--color-skor)" }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Form Awal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-md border p-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Sudah mengisi form awal</p>
                <p className="text-xs text-muted-foreground">Terakhir diperbarui: 1 Agustus 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Terapi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Sesi #6 selesai</p>
                  <p className="text-xs text-muted-foreground">10 Agustus 2026 - Penguatan otot</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Sesi #5 selesai</p>
                  <p className="text-xs text-muted-foreground">3 Agustus 2026 - Peregangan</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Sesi #4 selesai</p>
                  <p className="text-xs text-muted-foreground">27 Juli 2026 - Mobilisasi</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { role } = useUserRole();

  if (ADMIN_ROLES.includes(role)) {
    return <AdminDashboard />;
  }

  return <PatientDashboard />;
}
