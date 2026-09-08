import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarDays,
  Users,
  ClipboardList,
  Activity,
  ChevronRight,
  CalendarPlus,
  FileText,
  Settings,
  ScrollText,
  UserPlus,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getDashboardNavigationFlat } from '@/lib/permissions/dashboard-navigation';
import { getCurrentPatientIntake } from '@/server/queries/patient-intakes';
import { getDashboardStats } from '@/server/queries/dashboard-stats';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { ActivityPanel } from '@/components/dashboard/activity-panel';
import { getRecentActivities } from '@/server/queries/recent-activities';
import { AppointmentCalendar } from '@/components/dashboard/appointment-calendar';
import { getCalendarAppointments } from '@/server/queries/appointment-calendar';
import { getIndonesianHolidays } from '@/server/queries/indonesian-holidays';
import { getInternalCalendarEvents } from '@/server/queries/internal-calendar-events';
import type { Role } from '@/lib/permissions';

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

const quickAccessModules: Record<string, { label: string; href: string; icon: typeof Users; description: string }[]> = {
  SUPER_ADMIN: [
    { label: 'Manajemen Pengguna', href: '/dashboard/users', icon: Users, description: 'Kelola akun, peran, dan akses sistem.' },
    { label: 'Log Audit Sistem', href: '/dashboard/audit-logs', icon: ScrollText, description: 'Pantau aktivitas dan jejak akses.' },
    { label: 'Pengaturan Aplikasi', href: '/dashboard/settings', icon: Settings, description: 'Konfigurasi parameter global dan modul.' },
    { label: 'Kalender & Penjadwalan', href: '/dashboard/appointments', icon: CalendarDays, description: 'Atur jadwal terapi dan janji temu.' },
  ],
  ADMIN: [
    { label: 'Data Pasien', href: '/dashboard/patients', icon: Users, description: 'Kelola data pasien dan informasi kontak.' },
    { label: 'Verifikasi Intake', href: '/dashboard/intake', icon: ClipboardList, description: 'Tinjau dan verifikasi form awal pasien.' },
    { label: 'Kelola Staf & Akun', href: '/dashboard/users', icon: UserPlus, description: 'Kelola akun staf dan pengguna sistem.' },
    { label: 'Kalender & Penjadwalan', href: '/dashboard/appointments', icon: CalendarDays, description: 'Atur jadwal terapi dan janji temu.' },
  ],
  THERAPIST: [
    { label: 'Pasien Saya', href: '/dashboard/patients', icon: Users, description: 'Lihat daftar pasien yang ditangani.' },
    { label: 'Intake Medis', href: '/dashboard/intake', icon: ClipboardList, description: 'Tinjau form awal pasien baru.' },
    { label: 'Kalender & Penjadwalan', href: '/dashboard/appointments', icon: CalendarDays, description: 'Lihat jadwal terapi harian.' },
  ],
  STAFF: [
    { label: 'Registrasi Pasien', href: '/dashboard/patients', icon: UserPlus, description: 'Daftarkan pasien baru ke sistem.' },
    { label: 'Direktori Akun', href: '/dashboard/users', icon: Users, description: 'Lihat dan kelola akun pengguna.' },
    { label: 'Kalender & Penjadwalan', href: '/dashboard/appointments', icon: CalendarDays, description: 'Atur jadwal terapi dan janji temu.' },
  ],
};

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

  return (
    <div className="flex min-h-full flex-col gap-5 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-5 xl:pr-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#fffce5] via-[#fffce5] to-[#fff0a3] p-6 md:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-hafta-ylw-50/35 blur-2xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1 max-w-lg">
              <h1 className="text-2xl font-bold leading-snug text-hafta-ylw-900 md:text-[28px]">
                {getGreeting()}, {userName || 'Pasien'} <span className="inline-block">👋</span>
              </h1>
              <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-hafta-ylw-900">
                Kelola informasi awal, akses riwayat rekam terapi, dan jaga keamanan akun Anda.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-hafta-ylw-900">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                <span>{getFormattedToday()}</span>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[200px] md:block">
              <Image
                src="/images/models/model-patient-3.png"
                alt=""
                width={200}
                height={160}
                className="h-full w-auto object-contain object-right-bottom"
                priority
                unoptimized
              />
            </div>
            <div className="pointer-events-none absolute right-[220px] top-4 z-10 hidden select-none md:flex md:flex-col md:items-end">
              <span className="font-slogan text-right text-[26px] leading-tight text-hafta-ylw-800">
                Better<br />Movement<br />Better Life
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-hafta-ylw-100 bg-hafta-ylw-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hafta-ylw-100 text-hafta-ylw-700">
                <ClipboardList className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <p className="font-semibold text-[#111827]">{intakeCopy.title}</p>
                <p className="mt-0.5 text-[13px] text-[#6B7280]">{intakeCopy.description}</p>
              </div>
            </div>
            <Link
              href="/dashboard/intake"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-hafta-ylw-200 px-5 text-[13px] font-semibold text-hafta-ylw-900 transition-all hover:bg-hafta-ylw-300 active:scale-[0.98]"
            >
              {intakeCopy.action} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#9CA3AF]">Akses Cepat</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Lengkapi Form Awal', description: 'Lengkapi informasi untuk layanan Anda.', href: '/dashboard/intake', icon: ClipboardList },
              { label: 'Data Saya', description: 'Perbarui informasi profil Anda.', href: '/dashboard/profile', icon: Users },
              { label: 'Riwayat Terapi', description: 'Lihat rekam terapi yang tersedia.', href: '/dashboard/history', icon: FileText },
              { label: 'Keamanan Akun', description: 'Kelola keamanan dan sesi akun.', href: '/dashboard/security', icon: Activity },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all hover:border-hafta-ylw-200/50 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hafta-ylw-50 text-hafta-ylw-600 transition-colors group-hover:bg-hafta-ylw-200 group-hover:text-hafta-ylw-900">
                  <card.icon className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#111827]">{card.label}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">{card.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#D1D5DB] transition-transform group-hover:translate-x-0.5 group-hover:text-hafta-ylw-700" />
              </Link>
            ))}
          </div>
        </div>

        <AppointmentCalendar
          appointments={calendarAppointments}
          initialMonth={month}
          holidays={holidays}
          internalEvents={internalEvents}
        />
      </div>

      <aside className="hidden w-[300px] shrink-0 self-start xl:flex xl:flex-col xl:gap-4 xl:sticky xl:top-[80px]">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hafta-ylw-50 text-hafta-ylw-700">
            <ClipboardList className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <h2 className="mt-4 text-[13px] font-bold text-[#111827]">Form Awal Anda</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-[#9CA3AF]">Lengkapi data awal agar tim Hafta dapat mempersiapkan layanan Anda.</p>
          <Link href="/dashboard/intake" className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-hafta-ylw-800 transition-colors hover:text-hafta-ylw-900">
            Buka Form Awal <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </aside>
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

  const showCharts = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'THERAPIST';
  const stats = showCharts ? await getDashboardStats() : null;
  const allowedRoutes = new Set(getDashboardNavigationFlat(role).map((item) => item.href));
  const modules = (quickAccessModules[role] ?? []).filter((m) => allowedRoutes.has(m.href));
  const activities = await getRecentActivities(8);

  return (
    <div className="flex flex-col xl:flex-row min-h-full gap-0">
      {/* ═══ MAIN CONTENT COLUMN ═══ */}
      <div className="min-w-0 flex-1 space-y-5 pr-0 xl:pr-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg  bg-gradient-to-l from-[#fffce5] via-[#fffce5] to-[#fff0a3] p-6 md:p-7">
          {/* Decorative blob */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[var(--hafta-ylw-50)]/35 blur-2xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1 max-w-lg">
              <h1 className="text-2xl md:text-[28px] font-bold text-hafta-ylw-900 leading-snug">
                {getGreeting()}, {session.user.name || 'Admin'}{' '}
                <span className="inline-block">👋</span>
              </h1>
              <p className="mt-2 text-hafta-ylw-900 text-[12px] max-w-xl w-md leading-relaxed">
                Berikut adalah ringkasan aktivitas dan data penting dari sistem Hafta Fisioterapi hari ini.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-hafta-ylw-900">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{getFormattedToday()}</span>
              </div>
            </div>
            {/* Gambar hero — terapis + pasien, right-aligned */}
            <div className="hidden md:block absolute right-0 bottom-0 h-full w-[200px] pointer-events-none">
              <Image
                src="/images/models/model-patient-5.png"
                alt=""
                width={200}
                height={160}
                className="h-full w-auto object-contain object-right-bottom"
                priority
                unoptimized
              />
            </div>
            {/* Slogan — ditampilkan di antara teks kiri dan gambar kanan */}
            <div className="hidden md:flex flex-col items-end gap-1 absolute right-[220px] top-4 pointer-events-none select-none z-10">
              <span className="font-slogan text-[26px] text-[var(--hafta-ylw-800)] leading-tight text-right">
                Better<br />Movement<br />Better Life
              </span>
            </div>
          </div>
        </div>

        {/* KPI & Charts */}
        {stats ? <DashboardCharts initialStats={stats} role={role} /> : null}

        {/* Quick Access Modules */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#9CA3AF]">Akses Cepat Modul</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="group flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all hover:border-[var(--hafta-ylw-200)]/50 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-ylw-50)] text-hafta-ylw-600 transition-colors group-hover:bg-[var(--hafta-ylw-200)] group-hover:text-white">
                  <mod.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#111827] truncate">{mod.label}</p>
                  <p className="text-[11px] text-[#6B7280] truncate mt-0.5">{mod.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#D1D5DB] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--hafta-ylw-200)]" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — sticky ═══ */}
      <aside className="hidden xl:flex w-[300px] shrink-0 flex-col gap-4 self-start sticky top-[80px]">
        {/* Buat Appointment CTA */}
        {hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE) ? (
          <Link
            href="/dashboard/appointments/new"
            className="flex items-center justify-center gap-2 rounded-2xl bg-hafta-ylw-100 px-5 py-3.5 text-[14px] font-bold text-hafta-ylw-900 shadow-lg shadow-hafta-ylw-200/50 transition-all duration-300 hover:bg-hafta-ylw-400 hover:shadow-hafta-ylw-400/60 hover:text-white active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" /> Buat Appointment
          </Link>
        ) : null}

        {/* Activity Panel */}
        <ActivityPanel activities={activities} />
      </aside>

      {/* Mobile: Activity Panel below content */}
      <div className="mt-5 block xl:hidden w-full">
        {hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE) ? (
          <Link
            href="/dashboard/appointments/new"
            className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-[var(--hafta-ylw-200)] px-5 py-3.5 text-[14px] font-bold text-[#111827] shadow-md transition-all hover:bg-[var(--hafta-ylw-300)]"
          >
            <Plus className="h-5 w-5" /> Buat Appointment
          </Link>
        ) : null}
        <ActivityPanel activities={activities} />
      </div>
    </div>
  );
}

