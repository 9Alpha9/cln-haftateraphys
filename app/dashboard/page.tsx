import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarPlus,
  ClipboardList,
  FileText,
  LockKeyhole,
  Settings,
  Shield,
  Users,
  Sparkles,
  ChevronRight,
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

const adminOverview: Record<
  Exclude<Role, 'USER'>,
  {
    title: string;
    description: string;
    roleBadge: string;
    cards: { label: string; description: string; href: string; icon: typeof Users; colorClass: string; iconClass: string; bgGradient: string }[];
  }
> = {
  SUPER_ADMIN: {
    title: 'Ringkasan Administrasi Sistem',
    description: 'Kelola akun pengguna, kontrol otorisasi hak akses, pantau log audit, dan atur preferensi sistem Hafta Fisioterapi.',
    roleBadge: 'Super Admin',
    cards: [
      {
        label: 'Manajemen Pengguna',
        description: 'Kelola akun, peran, dan status aktivasi pengguna sistem.',
        href: '/dashboard/users',
        icon: Users,
        colorClass: 'bg-accent/20 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/20 to-transparent',
      },
      {
        label: 'Log Audit Sistem',
        description: 'Pantau rekam jejak aktivitas sensitif dan administratif.',
        href: '/dashboard/audit-logs',
        icon: FileText,
        colorClass: 'bg-accent/15 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/10 to-transparent',
      },
      {
        label: 'Pengaturan Aplikasi',
        description: 'Konfigurasi parameter global dan modul operasional.',
        href: '/dashboard/settings',
        icon: Settings,
        colorClass: 'bg-accent/10 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/10 to-transparent',
      },
    ],
  },
  ADMIN: {
    title: 'Ringkasan Operasional Klinik',
    description: 'Pantau workflow layanan pasien, penanganan form intake, dan koordinasi staf operasional.',
    roleBadge: 'Administrator',
    cards: [
      {
        label: 'Data Pasien',
        description: 'Akses dan kelola direktori pasien terdaftar.',
        href: '/dashboard/patients',
        icon: Users,
        colorClass: 'bg-accent/20 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/20 to-transparent',
      },
      {
        label: 'Verifikasi Intake',
        description: 'Tinjau dan proses formulir pendaftaran pasien baru.',
        href: '/dashboard/intake',
        icon: ClipboardList,
        colorClass: 'bg-accent/15 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/15 to-transparent',
      },
      {
        label: 'Kelola Staf & Akun',
        description: 'Atur data akses akun sesuai cakupan hak akses.',
        href: '/dashboard/users',
        icon: Users,
        colorClass: 'bg-accent/10 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/10 to-transparent',
      },
    ],
  },
  THERAPIST: {
    title: 'Ringkasan Layanan Terapis',
    description: 'Pantau jadwal terapi harian, asesmen klinik pasien, dan catatan perkembangan penanganan.',
    roleBadge: 'Fisioterapis',
    cards: [
      {
        label: 'Pasien Saya',
        description: 'Lihat daftar pasien dalam penanganan aktif Anda.',
        href: '/dashboard/patients',
        icon: Users,
        colorClass: 'bg-accent/20 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/20 to-transparent',
      },
      {
        label: 'Intake Medis',
        description: 'Tinjau keluhan dan kondisi klinis awal pasien.',
        href: '/dashboard/intake',
        icon: ClipboardList,
        colorClass: 'bg-accent/15 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/15 to-transparent',
      },
    ],
  },
  STAFF: {
    title: 'Ringkasan Layanan Staf',
    description: 'Bantu registrasi, penjadwalan janji temu, dan kebutuhan administrasi operasional klinik.',
    roleBadge: 'Staf Klinik',
    cards: [
      {
        label: 'Registrasi Pasien',
        description: 'Kelola data identitas dan administratif pasien.',
        href: '/dashboard/patients',
        icon: Users,
        colorClass: 'bg-accent/20 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/20 to-transparent',
      },
      {
        label: 'Direktori Akun',
        description: 'Tinjau daftar informasi akun terdaftar.',
        href: '/dashboard/users',
        icon: Users,
        colorClass: 'bg-accent/10 text-[#92400e]',
        iconClass: 'text-[#92400e]',
        bgGradient: 'from-accent/10 to-transparent',
      },
    ],
  },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function getFormattedToday(): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
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
      colorClass: 'bg-accent/20 text-[#92400e]',
    },
    {
      label: 'Data Saya',
      description: 'Perbarui informasi profil Anda bila diperlukan.',
      href: '/dashboard/profile',
      icon: Users,
      colorClass: 'bg-accent/15 text-[#92400e]',
    },
    {
      label: 'Riwayat Terapi',
      description: 'Lihat informasi yang sudah ditandai dapat dilihat pasien.',
      href: '/dashboard/history',
      icon: FileText,
      colorClass: 'bg-accent/10 text-[#92400e]',
    },
    {
      label: 'Keamanan Akun',
      description: 'Kelola keamanan dan sesi akun Anda.',
      href: '/dashboard/security',
      icon: LockKeyhole,
      colorClass: 'bg-accent/10 text-[#92400e]',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {getGreeting()}, {userName || 'Pasien'}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Kelola informasi awal, akses riwayat rekam terapi, dan jaga keamanan akun Anda.
        </p>
      </div>

      <AppointmentCalendar
        appointments={calendarAppointments}
        initialMonth={month}
        holidays={holidays}
        internalEvents={internalEvents}
      />

      <div className="rounded-2xl border border-accent/40 bg-gradient-to-r from-accent/15 via-accent/10 to-transparent p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{intakeCopy.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{intakeCopy.description}</p>
            </div>
          </div>
          <Link
            href="/dashboard/intake"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 shadow-sm active:scale-98"
          >
            {intakeCopy.action} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Menu Utama</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-accent/40 hover:shadow-md active:scale-99"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.colorClass}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <h3 className="mt-4 font-bold text-foreground group-hover:text-[#92400e] transition-colors">{card.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.description}</p>
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
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
      {/* Hero Welcome Banner */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {getGreeting()}, {session.user.name || 'Admin'}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {overview.description}
        </p>
      </div>

      {/* Real-time KPI & Analytical Charts */}
      {stats ? <DashboardCharts initialStats={stats} role={role} /> : null}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Akses Cepat Modul</h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4.5 shadow-2xs transition-all duration-200 hover:border-accent/40 hover:shadow-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${card.bgGradient} opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.colorClass}`}>
                    <card.icon className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-[#92400e] transition-colors flex items-center gap-1">
                      {card.label}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{card.description}</p>
                  </div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Calendar Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Kalender & Penjadwalan</h2>
          </div>
          {hasPermission(role, PERMISSIONS.CALENDAR_EVENT_MANAGE) ? (
            <Link
              href="/dashboard/calendar-events/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-all hover:bg-muted"
            >
              <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" /> Tambah Event
            </Link>
          ) : null}
        </div>
        <AppointmentCalendar
          appointments={calendarAppointments}
          initialMonth={month}
          holidays={holidays}
          internalEvents={internalEvents}
        />
      </div>
    </div>
  );
}

