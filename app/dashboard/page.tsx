import Link from 'next/link';
import {
  ArrowRight,
  CalendarPlus,
  ClipboardList,
  FileText,
  LockKeyhole,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getDashboardNavigationFlat } from '@/lib/permissions/dashboard-navigation';
import { getCurrentPatientIntake } from '@/server/queries/patient-intakes';
import { getDashboardStats } from '@/server/queries/dashboard-stats';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
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
    cards: { label: string; description: string; href: string; icon: typeof Users }[];
  }
> = {
  SUPER_ADMIN: {
    title: 'Ringkasan Administrasi',
    description: 'Kelola akun, kontrol akses, audit, dan konfigurasi sistem Hafta.',
    cards: [
      { label: 'Pengguna', description: 'Tinjau akun dan status akses.', href: '/dashboard/users', icon: Users },
      {
        label: 'Log Audit',
        description: 'Pantau aktivitas administratif.',
        href: '/dashboard/audit-logs',
        icon: FileText,
      },
      { label: 'Pengaturan', description: 'Kelola konfigurasi sistem.', href: '/dashboard/settings', icon: Settings },
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
      },
      {
        label: 'Intake',
        description: 'Tinjau informasi awal yang memerlukan tindak lanjut.',
        href: '/dashboard/intake',
        icon: ClipboardList,
      },
      { label: 'Pengguna', description: 'Kelola akun sesuai permission.', href: '/dashboard/users', icon: Users },
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
      },
      {
        label: 'Intake',
        description: 'Tinjau intake sesuai scope klinis.',
        href: '/dashboard/intake',
        icon: ClipboardList,
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
      },
      { label: 'Pengguna', description: 'Tinjau akun sesuai permission.', href: '/dashboard/users', icon: Users },
    ],
  },
};

async function PatientDashboard({
  userId,
  calendarAppointments,
  month,
  holidays,
  internalEvents,
}: {
  userId: string;
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
    },
    {
      label: 'Data Saya',
      description: 'Perbarui informasi profil Anda bila diperlukan.',
      href: '/dashboard/profile',
      icon: Users,
    },
    {
      label: 'Riwayat Terapi',
      description: 'Lihat informasi yang sudah ditandai dapat dilihat pasien.',
      href: '/dashboard/history',
      icon: FileText,
    },
    {
      label: 'Keamanan Akun',
      description: 'Kelola keamanan dan sesi akun Anda.',
      href: '/dashboard/security',
      icon: LockKeyhole,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Patient Portal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Ringkasan Anda</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Kelola informasi awal, akses riwayat yang tersedia, dan jaga keamanan akun Anda.
        </p>
      </div>
      <AppointmentCalendar
        appointments={calendarAppointments}
        initialMonth={month}
        holidays={holidays}
        internalEvents={internalEvents}
      />
      <Card className="border-primary/15 bg-primary/[0.03] shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">{intakeCopy.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{intakeCopy.description}</p>
          </div>
          <Link
            href="/dashboard/intake"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {intakeCopy.action} <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <card.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold text-foreground">{card.label}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Buka <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
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
      <DashboardPageHeader
        title={overview.title}
        description={overview.description}
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      <Card className="border-primary/15 bg-primary/[0.03] shadow-sm">
        <CardContent className="flex items-start gap-3 p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Menu dan data yang tampil disesuaikan dengan permission. Akses klinis tetap membutuhkan scope atau
            assignment yang valid.
          </p>
        </CardContent>
      </Card>
      {stats ? <DashboardCharts initialStats={stats} /> : null}
      <div className="space-y-3">
        <div className="flex justify-end">
          {hasPermission(role, PERMISSIONS.CALENDAR_EVENT_MANAGE) ? (
            <Link href="/dashboard/calendar-events/new" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-primary hover:bg-primary/5">
              <CalendarPlus className="h-4 w-4" /> Tambah Event
            </Link>
          ) : null}
        </div>
        <AppointmentCalendar appointments={calendarAppointments} initialMonth={month} holidays={holidays} internalEvents={internalEvents} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <card.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold text-foreground">{card.label}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Buka <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
