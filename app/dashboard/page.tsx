import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getDashboardStats } from '@/server/queries/dashboard-stats';
import { getRecentActivities } from '@/server/queries/recent-activities';
import { getCurrentPatientIntake } from '@/server/queries/patient-intakes';
import {
  getPatientAppointmentRequests,
  getPatientBookingAvailability,
  getPatientPortalAppointments,
} from '@/server/queries/patient-portal';
import { getOwnMedicalRecordSummary, getScopedTherapyProgress } from '@/server/queries/therapy-progress';
import { PatientDashboardOverview } from '@/components/patient/patient-dashboard-overview';
import {
  getCalendarAppointments,
  getUpcomingScheduleAppointments,
} from '@/server/queries/appointment-calendar';
import { getIndonesianHolidays } from '@/server/queries/indonesian-holidays';
import { getPendingIntakeCount } from '@/server/queries/intake-review';
import { TherapistAnalyticsBento } from '@/components/dashboard/therapist/therapist-analytics-bento';
import { TherapistMonthCalendar } from '@/components/dashboard/therapist/therapist-month-calendar';
import { DesktopOnly } from '@/components/dashboard/desktop-only';
import { NewAppointmentButton } from '@/components/dashboard/appointments/new-appointment-button';
import Link from 'next/link';
import { Activity, CalendarClock, CalendarDays, CalendarPlus, ChevronRight, ClipboardCheck, Clock3, Users } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Selamat Malam';
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function getFormattedToday(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

async function PatientDashboard({
  userId,
  userName,
}: {
  userId: string;
  userName?: string;
}) {
  const [intake, medicalSummary, appointments, requests, progress, availability, holidays] =
    await Promise.all([
      getCurrentPatientIntake(userId),
      getOwnMedicalRecordSummary(),
      getPatientPortalAppointments(),
      getPatientAppointmentRequests(),
      getScopedTherapyProgress({ page: 1, pageSize: 3 }),
      getPatientBookingAvailability(),
      getIndonesianHolidays(new Date().getFullYear()).catch(() => []),
    ]);

  return (
    <PatientDashboardOverview
      userName={userName}
      treatmentGoal={medicalSummary?.therapyGoal ?? null}
      intake={intake ? { status: intake.status, reviewMessage: intake.reviewMessage ?? null } : null}
      appointments={appointments}
      requests={requests}
      availability={availability}
      records={progress.items}
      totalRecords={progress.total}
      holidays={holidays}
    />
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { session, role } = await requireSession({ redirectToLogin: true });

  if (role === 'USER') {
    return (
      <PatientDashboard
        userId={session.user.id}
        userName={session.user.name ?? ''}
      />
    );
  }

  const { month } = await searchParams;
  const currentMonth = new Date();
  const monthStr = /^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? '')
    ? month!
    : `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  const currentYear = new Date().getFullYear();
  const [holidays, nextYearHolidays] = await Promise.all([
    getIndonesianHolidays(currentYear),
    getIndonesianHolidays(currentYear + 1),
  ]);

  const [calendarAppointments, upcomingAppointments] = await Promise.all([
    getCalendarAppointments(monthStr),
    getUpcomingScheduleAppointments(),
  ]);

  const isTherapist = role === 'THERAPIST';
  const showCharts = role === 'SUPER_ADMIN' || role === 'ADMIN' || isTherapist;
  const stats = showCharts ? await getDashboardStats() : null;
  const activities = await getRecentActivities({ limit: 8, userId: session.user.id });
  const canCreateAppt = hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE);
  const canCompleteAppt = hasPermission(role, PERMISSIONS.APPOINTMENT_COMPLETE);
  const canReviewIntake = hasPermission(role, PERMISSIONS.INTAKE_READ);
  const canManageUsers = hasPermission(role, PERMISSIONS.USER_LIST);
  const canManageSettings = hasPermission(role, PERMISSIONS.SETTINGS_MANAGE);
  const pendingIntake = canReviewIntake ? await getPendingIntakeCount() : 0;

  const toKey = (value: Date | string) =>
    typeof value === 'string'
      ? value.slice(0, 10)
      : `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
          value.getDate(),
        ).padStart(2, '0')}`;
  const todayKey = toKey(new Date());
  const todayAppointments = calendarAppointments.filter(
    (appointment) => toKey(appointment.scheduledDate) === todayKey,
  );
  const nextAppointment = upcomingAppointments[0] ?? null;
  const activePatients = stats?.kpis.activePatients ?? 0;
  const firstName = session.user.name?.split(' ')[0] || 'Tim Hafta';

  const formatAppointmentDate = (value: Date | string) => {
    const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4 pb-6 sm:space-y-5">
      <header className="flex flex-col gap-4 border-b border-stone-200/90 pb-3 pt-3 sm:flex-row sm:items-end sm:justify-between sm:pb-5 sm:pt-4">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600 sm:hidden">
            <CalendarDays className="h-3 w-3" />
            {getFormattedToday()}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#181700] sm:text-3xl">
            Halo, {firstName}
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-stone-500 sm:text-sm">
            {pendingIntake > 0
              ? `${pendingIntake} intake menunggu tinjauan.`
              : 'Tidak ada intake yang menunggu tinjauan.'}
            {nextAppointment
              ? ` Sesi berikutnya ${formatAppointmentDate(nextAppointment.scheduledDate)} pukul ${nextAppointment.startTime.slice(0, 5)}.`
              : ' Belum ada jadwal mendatang.'}
          </p>
        </div>
        <div className="flex w-full flex-row items-center gap-2 sm:w-auto sm:shrink-0">
          {canCreateAppt ? (
            <NewAppointmentButton className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-ylw-100)] px-3 text-xs font-bold text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-200)] sm:flex-none sm:px-4">
              <CalendarPlus className="h-4 w-4" /> Buat Appointment
            </NewAppointmentButton>
          ) : null}
          {canReviewIntake ? (
            <Link
              href="/dashboard/intake"
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-bold text-[#181700] transition-colors hover:bg-stone-50 sm:flex-none sm:px-4"
            >
              <ClipboardCheck className="h-4 w-4" /> Tinjau Intake
            </Link>
          ) : null}
        </div>
      </header>

      <h2 className="sr-only">Ringkasan dashboard</h2>

      <section
        aria-label="Ringkasan cepat"
        className="-mx-3 flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-3 pb-1 scroll-px-3 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <article className="flex min-w-[230px] snap-start flex-col justify-between rounded-3xl border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-100)] p-3.5 text-[#181700] lg:min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#181700]/70">
                Sesi berikutnya
              </p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#181700]">
                <CalendarClock className="h-4 w-4" />
              </span>
            </div>
            <h3 className="mt-2 text-lg font-extrabold leading-tight">
              {nextAppointment
                ? `${formatAppointmentDate(nextAppointment.scheduledDate)} · ${nextAppointment.startTime.slice(0, 5)}`
                : 'Belum ada jadwal'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#181700]/80">
              {nextAppointment?.patientName ?? 'Tambahkan jadwal baru'}
            </p>
          </div>
          <Link
            href="/dashboard/appointments"
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-[#181700]/15 bg-white/80 text-xs font-bold transition-colors hover:bg-white"
          >
            Lihat jadwal
          </Link>
        </article>

        <article className="flex min-w-[230px] snap-start flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-3.5 lg:min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-stone-500">
                Intake menunggu
              </p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4F4F1] text-[#181700]">
                <ClipboardCheck className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold leading-none text-[#181700]">
              {pendingIntake}
              <span className="ml-1 text-xs font-semibold text-stone-400">berkas</span>
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-stone-500">
              {pendingIntake > 0 ? 'Perlu ditinjau hari ini.' : 'Semua intake sudah ditinjau.'}
            </p>
          </div>
          <Link
            href="/dashboard/intake"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#F4F4F1] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-100)]"
          >
            Tinjau intake
          </Link>
        </article>

        <article className="flex min-w-[230px] snap-start flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-3.5 lg:min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-stone-500">
                Sesi hari ini
              </p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4F4F1] text-[#181700]">
                <Clock3 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold leading-none text-[#181700]">
              {todayAppointments.length}
              <span className="ml-1 text-xs font-semibold text-stone-400">sesi</span>
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-stone-500">
              {todayAppointments.length > 0
                ? `Mulai ${todayAppointments[0].startTime.slice(0, 5)}.`
                : 'Tidak ada sesi terjadwal hari ini.'}
            </p>
          </div>
          <Link
            href="/dashboard/appointments"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#F4F4F1] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-100)]"
          >
            Lihat kalender
          </Link>
        </article>

        <article className="flex min-w-[230px] snap-start flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-3.5 lg:min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-stone-500">
                Pasien aktif
              </p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4F4F1] text-[#181700]">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold leading-none text-[#181700]">
              {activePatients}
              <span className="ml-1 text-xs font-semibold text-stone-400">pasien</span>
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-stone-500">
              Total pasien yang sedang dalam program.
            </p>
          </div>
          <Link
            href="/dashboard/patients"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#F4F4F1] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-100)]"
          >
            Lihat pasien
          </Link>
        </article>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="min-w-0 space-y-4 lg:col-span-8">
          <section className="-mx-3 rounded-none border-y border-stone-200/90 bg-white p-3 sm:mx-0 sm:rounded-3xl sm:border sm:p-5">
            <div className="px-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                    Kalender
                  </p>
                  <h2 className="mt-1 text-base font-bold text-[#181700]">Jadwal terapi</h2>
                </div>
                <Link
                  href="/dashboard/appointments"
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-stone-200/70 bg-[#FAFAF8] px-3 text-[11px] font-bold text-[#181700] transition-colors hover:bg-stone-100"
                >
                  Semua jadwal
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                Pilih tanggal untuk melihat sesi pasien pada hari tersebut.
              </p>
            </div>
            <div className="mt-3">
              <TherapistMonthCalendar
                appointments={[...upcomingAppointments, ...calendarAppointments].filter(
                  (appointment, index, list) =>
                    list.findIndex((item) => item.id === appointment.id) === index,
                )}
                holidays={[...holidays, ...nextYearHolidays]}
              />
            </div>
          </section>

          {showCharts && !isTherapist && stats ? (
            <DesktopOnly>
              <TherapistAnalyticsBento stats={stats} isTherapist={false} panel="trend" />
            </DesktopOnly>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4 lg:col-span-4 lg:sticky lg:top-[88px] lg:self-start">
          {stats ? (
            <DesktopOnly>
              <TherapistAnalyticsBento stats={stats} isTherapist={isTherapist} panel="status" />
            </DesktopOnly>
          ) : null}

          <section className="rounded-3xl border border-stone-200/90 bg-white p-3.5 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  Aktivitas
                </p>
                <h2 className="mt-1 text-base font-bold text-[#181700]">Terbaru</h2>
              </div>
              <Link
                href="/dashboard/notifications"
                className="inline-flex h-9 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-[#181700] hover:bg-stone-100"
              >
                Semua
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {activities.slice(0, 4).map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-start gap-3 rounded-2xl bg-[#FAFAF8] px-3 py-2.5"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#181700]">
                    <Activity className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#181700]">
                      {activity.description}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[10px] text-stone-500">
                      <span className="font-medium">{activity.actorName ?? 'Sistem'}</span>
                      <span className="text-stone-300">•</span>
                      <span>
                        {new Date(activity.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
              {activities.length === 0 ? (
                <li className="py-4 sm:py-6 text-center text-xs text-stone-500">
                  Belum ada aktivitas terbaru.
                </li>
              ) : null}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
