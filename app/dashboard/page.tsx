import Link from 'next/link';
import {
  ArrowRight,
  CalendarPlus,
  ClipboardList,
  FileText,
  LockKeyhole,
  Settings,
  Users,
} from 'lucide-react';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getDashboardNavigationFlat } from '@/lib/permissions/dashboard-navigation';
import { getCurrentPatientIntake } from '@/server/queries/patient-intakes';
import { getDashboardStats } from '@/server/queries/dashboard-stats';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { AppointmentCalendar } from '@/components/dashboard/appointment-calendar';
import { getCalendarAppointments } from '@/server/queries/appointment-calendar';
import { getIndonesianHolidays } from '@/server/queries/indonesian-holidays';
import { getInternalCalendarEvents } from '@/server/queries/internal-calendar-events';
import type { Role } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const adminOverview: Record<
  Exclude<Role, 'USER'>,
  {
    title: string;
    description: string;
    cards: { label: string; description: string; href: string; icon: typeof Users; colorClass: string; iconClass: string }[];
  }
> = {
  SUPER_ADMIN: {
    title: 'Ringkasan Administrasi',
    description: 'Kelola akun, kontrol akses, audit, dan konfigurasi sistem Hafta.',
    cards: [
      { label: 'Pengguna', description: 'Tinjau akun dan status akses.', href: '/dashboard/users', icon: Users, colorClass: 'bg-blue-50', iconClass: 'text-blue-600' },
      {
        label: 'Log Audit',
        description: 'Pantau aktivitas administratif.',
        href: '/dashboard/audit-logs',
        icon: FileText,
        colorClass: 'bg-amber-50',
        iconClass: 'text-amber-600',
      },
      { label: 'Pengaturan', description: 'Kelola konfigurasi sistem.', href: '/dashboard/settings', icon: Settings, colorClass: 'bg-slate-100', iconClass: 'text-slate-600' },
    ],
  },
  ADMIN: {
    title: 'Ringkasan Operasional',
    description: 'Pantau workflow pasien dan tindak lanjuti aktivitas operasional yang menjadi tanggung jawab Anda.',
    cards: [
      {
        label: 'Pasien',
        description: 'Akses pasien sesuai scope yang ditugaskan.',
        href: '/dashboard/patients',
        icon: Users,
        colorClass: 'bg-emerald-50',
        iconClass: 'text-emerald-600',
      },
      {
        label: 'Intake',
        description: 'Tinjau informasi awal yang memerlukan tindak lanjut.',
        href: '/dashboard/intake',
        icon: ClipboardList,
        colorClass: 'bg-violet-50',
        iconClass: 'text-violet-600',
      },
      { label: 'Pengguna', description: 'Kelola akun sesuai permission.', href: '/dashboard/users', icon: Users, colorClass: 'bg-blue-50', iconClass: 'text-blue-600' },
    ],
  },
  THERAPIST: {
    title: 'Ringkasan Terapis',
    description: 'Akses hanya pasien dan pekerjaan klinis yang ditugaskan kepada Anda.',
    cards: [
      {
        label: 'Pasien Saya',
        description: 'Lihat pasien dengan assignment aktif.',
        href: '/dashboard/patients',
        icon: Users,
        colorClass: 'bg-emerald-50',
        iconClass: 'text-emerald-600',
      },
      {
        label: 'Intake',
        description: 'Tinjau intake sesuai scope klinis.',
        href: '/dashboard/intake',
        icon: ClipboardList,
        colorClass: 'bg-violet-50',
        iconClass: 'text-violet-600',
      },
    ],
  },
  STAFF: {
    title: 'Ringkasan Staff',
    description: 'Akses informasi administratif sesuai peran dan scope kerja Anda.',
    cards: [
      {
        label: 'Pasien',
        description: 'Kelola data administratif sesuai scope.',
        href: '/dashboard/patients',
        icon: Users,
        colorClass: 'bg-emerald-50',
        iconClass: 'text-emerald-600',
      },
      { label: 'Pengguna', description: 'Tinjau akun sesuai permission.', href: '/dashboard/users', icon: Users, colorClass: 'bg-blue-50', iconClass: 'text-blue-600' },
    ],
  },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

async function PatientDashboard({
  userId,
  userName,
  calendarAppointments,
  month,
  holidays,
  internalEvents,
}: {
  userId: string;
  userName?: string;
  calendarAppointments: Awaited<ReturnType<typeof getCalendarAppointments>>;
  month: string;
  holidays: Awaited<ReturnType<typeof getIndonesianHolidays>>;
  internalEvents: Awaited<ReturnType<typeof getInternalCalendarEvents>>;
}) {
  const intake = await getCurrentPatientIntake(userId);
  const intakeCopy =
    intake?.status === 'DRAFT'
      ? {
        title: 'Lanjutkan Form Awal',
        description: 'Draft Form Awal Anda masih dapat dilengkapi.',
        action: 'Lanjutkan Form Awal',
      }
      : intake?.status === 'NEEDS_REVISION'
        ? {
          title: 'Perbaiki Form Awal',
          description: 'Tim Hafta meminta perbaikan pada Form Awal Anda.',
          action: 'Perbaiki Form Awal',
        }
        : intake?.status === 'SUBMITTED' || intake?.status === 'UNDER_REVIEW'
          ? {
            title: 'Form Awal sedang ditinjau',
            description: 'Data Anda telah dikirim dan sedang ditinjau oleh tim Hafta.',
            action: 'Lihat Form Awal',
          }
          : intake?.status === 'ACCEPTED'
            ? {
              title: 'Form Awal diterima',
              description: 'Informasi awal Anda telah diterima oleh tim Hafta.',
              action: 'Lihat Form Awal',
            }
            : {
              title: 'Mulai dari Form Awal',
              description: 'Lengkapi informasi yang dibutuhkan sebelum proses berikutnya.',
              action: 'Isi Form Awal',
            };
  const cards = [
    {
      label: 'Lengkapi Form Awal',
      description: 'Berikan informasi awal untuk membantu persiapan layanan.',
      href: '/dashboard/intake',
      icon: ClipboardList,
      colorClass: 'bg-violet-50',
      iconClass: 'text-violet-600',
    },
    {
      label: 'Data Saya',
      description: 'Perbarui informasi profil Anda bila diperlukan.',
      href: '/dashboard/profile',
      icon: Users,
      colorClass: 'bg-blue-50',
      iconClass: 'text-blue-600',
    },
    {
      label: 'Riwayat Terapi',
      description: 'Lihat informasi yang sudah ditandai dapat dilihat pasien.',
      href: '/dashboard/history',
      icon: FileText,
      colorClass: 'bg-emerald-50',
      iconClass: 'text-emerald-600',
    },
    {
      label: 'Keamanan Akun',
      description: 'Kelola keamanan dan sesi akun Anda.',
      href: '/dashboard/security',
      icon: LockKeyhole,
      colorClass: 'bg-amber-50',
      iconClass: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {getGreeting()}, {userName || 'Pasien'}! 👋
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Kelola informasi awal, akses riwayat yang tersedia, dan jaga keamanan akun Anda.
        </p>
      </div>
      <AppointmentCalendar
        appointments={calendarAppointments}
        initialMonth={month}
        holidays={holidays}
        internalEvents={internalEvents}
      />
      <div className="rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/[0.04] to-transparent p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{intakeCopy.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{intakeCopy.description}</p>
            </div>
          </div>
          <Link
            href="/dashboard/intake"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {intakeCopy.action} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Menu Utama</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-border/60 bg-white p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.colorClass}`}>
                  <card.icon className={`h-6 w-6 ${card.iconClass}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-foreground">{card.label}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { role, session } = await requireSession({ redirectToLogin: true });
  const params = await searchParams;
  const currentMonth = new Date();
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? '')
    ? params.month!
    : `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const calendarAppointments = await getCalendarAppointments(month);
  const holidays = await getIndonesianHolidays(Number(month.slice(0, 4)));
  const internalEvents = await getInternalCalendarEvents(month);

  if (role === 'USER')
    return (
      <PatientDashboard
        userId={session.user.id}
        userName={session.user.name ?? ''}
        calendarAppointments={calendarAppointments}
        month={month}
        holidays={holidays}
        internalEvents={internalEvents}
      />
    );

  const overview = adminOverview[role];
  const allowedRoutes = new Set(getDashboardNavigationFlat(role).map((item) => item.href));
  const cards = overview.cards.filter((card) => allowedRoutes.has(card.href));
  const showCharts = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'THERAPIST';
  const stats = showCharts ? await getDashboardStats() : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {getGreeting()}, {session.user.name || 'Admin'}! 👋
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {overview.description}
        </p>
      </div>
      {stats ? <DashboardCharts initialStats={stats} /> : null}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Kalender Terapi</h2>
          {hasPermission(role, PERMISSIONS.CALENDAR_EVENT_MANAGE) ? (
            <Link href="/dashboard/calendar-events/new" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted">
              <CalendarPlus className="h-4 w-4" /> Tambah Event
            </Link>
          ) : null}
        </div>
        <AppointmentCalendar appointments={calendarAppointments} initialMonth={month} holidays={holidays} internalEvents={internalEvents} />
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Akses Cepat</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-border/60 bg-white p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.colorClass}`}>
                  <card.icon className={`h-6 w-6 ${card.iconClass}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-foreground">{card.label}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
