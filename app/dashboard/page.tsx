import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getDashboardStats } from '@/server/queries/dashboard-stats';
import { getRecentActivities } from '@/server/queries/recent-activities';
import { getCurrentPatientIntake } from '@/server/queries/patient-intakes';
import {
  getPatientAppointmentRequests,
  getPatientPortalAppointments,
} from '@/server/queries/patient-portal';
import { getOwnMedicalRecordSummary, getScopedTherapyProgress } from '@/server/queries/therapy-progress';
import { PatientDashboardOverview } from '@/components/patient/patient-dashboard-overview';
import {
  getCalendarAppointments,
  getUpcomingScheduleAppointments,
} from '@/server/queries/appointment-calendar';
import { getIndonesianHolidays } from '@/server/queries/indonesian-holidays';
import { getInternalCalendarEvents } from '@/server/queries/internal-calendar-events';
import { AppointmentCalendar } from '@/components/dashboard/appointment-calendar';
import { TherapistKpiGrid } from '@/components/dashboard/therapist/therapist-kpi-grid';
import { TherapistAnalyticsBento } from '@/components/dashboard/therapist/therapist-analytics-bento';
import { TherapistScheduleCalendar } from '@/components/dashboard/therapist/therapist-schedule-calendar';
import { NewAppointmentButton } from '@/components/dashboard/appointments/new-appointment-button';
import { RoleActivityHub } from '@/components/dashboard/shared/role-activity-hub';
import { LiveGreeting } from '@/components/dashboard/live-greeting';
import Link from 'next/link';
import {
  Plus,
  ChevronRight,
  ClipboardList,
  Clock,
  UserCheck,
  ArrowUpRight,
} from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
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
  const [intake, medicalSummary, appointments, requests, progress] = await Promise.all([
    getCurrentPatientIntake(userId),
    getOwnMedicalRecordSummary(),
    getPatientPortalAppointments(),
    getPatientAppointmentRequests(),
    getScopedTherapyProgress({ page: 1, pageSize: 3 }),
  ]);

  return (
    <PatientDashboardOverview
      userName={userName}
      treatmentGoal={medicalSummary?.therapyGoal ?? null}
      intake={intake ? { status: intake.status, reviewMessage: intake.reviewMessage ?? null } : null}
      appointments={appointments}
      requests={requests}
      records={progress.items}
      totalRecords={progress.total}
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
  const [holidays, nextYearHolidays, internalEvents] = await Promise.all([
    getIndonesianHolidays(currentYear),
    getIndonesianHolidays(currentYear + 1),
    getInternalCalendarEvents(monthStr),
  ]);

  const [calendarAppointments, upcomingAppointments] = await Promise.all([
    getCalendarAppointments(monthStr),
    getUpcomingScheduleAppointments(),
  ]);

  const isTherapist = role === 'THERAPIST';
  const showCharts = role === 'SUPER_ADMIN' || role === 'ADMIN' || isTherapist;
  const stats = showCharts ? await getDashboardStats() : null;
  const activities = await getRecentActivities(8);
  const canCreateAppt = hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE);
  const canCompleteAppt = hasPermission(role, PERMISSIONS.APPOINTMENT_COMPLETE);

  return (
    <div className="flex flex-col xl:flex-row min-h-full gap-6">
      {/* ═══ MAIN CONTENT COLUMN (LEFT) ═══ */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header Halaman Terapis / Admin */}
        <header className="border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <LiveGreeting
                name={session.user.name || (isTherapist ? 'Terapis' : 'Admin')}
                initialNow={new Date().toISOString()}
              />
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                Pantau jadwal pendampingan pasien, tinjau keluhan baru, dan kelola catatan perkembangan terapi.
              </p>
            </div>

            <dl className="grid shrink-0 grid-cols-2 gap-x-10 gap-y-3 border-t border-stone-100 pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div>
                <dt className="text-[11px] font-medium text-stone-500">Jadwal bulan ini</dt>
                <dd className="mt-0.5 font-mono text-xl font-extrabold text-[#181700]">
                  {calendarAppointments.length}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-stone-500">Agenda internal</dt>
                <dd className="mt-0.5 font-mono text-xl font-extrabold text-[#181700]">
                  {internalEvents.length}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        {/* ── 4 KARTU METRIK UTAMA (INTEGRASI NOTCHEDCARD) ── */}
        {stats && <TherapistKpiGrid stats={stats} isTherapist={isTherapist} />}

        {/* ── ANALYTICS BENTO PANEL (TREN & KOMPOSISI REAL DATA) ── */}
        {stats && <TherapistAnalyticsBento stats={stats} isTherapist={isTherapist} />}

        {/* ── JADWAL TERAPI MENDATANG ── */}
        <TherapistScheduleCalendar
          appointments={upcomingAppointments}
          canCreate={canCreateAppt}
          canComplete={canCompleteAppt}
          holidays={[...holidays, ...nextYearHolidays]}
        />
      </div>

      {/* ═══ RIGHT PANEL (STICKY ON DESKTOP) ═══ */}
      <aside className="w-full xl:w-[330px] shrink-0 flex flex-col gap-5 self-start xl:sticky xl:top-[88px]">
        {/* Tombol Aksi Utama: + Buat Appointment */}
        {canCreateAppt && (
          <NewAppointmentButton className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--hafta-ylw-100)] px-5 py-3.5 text-sm font-bold text-[#181700] shadow-xs transition-all hover:bg-[var(--hafta-ylw-200)] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]">
            <Plus className="h-4 w-4" />
            <span>Buat Appointment Baru</span>
          </NewAppointmentButton>
        )}

        {/* ── KOMPONEN GLOBAL FOLDER-TAB ACTIVITY HUB (REFERENSI GAMBAR 2) ── */}
        <RoleActivityHub
          activities={activities}
          role={role}
          userName={session.user.name ?? ''}
          dateLabel={getFormattedToday()}
        />
      </aside>
    </div>
  );
}
