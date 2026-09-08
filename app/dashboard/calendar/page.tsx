import { CalendarDays } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { FullWeeklyCalendar } from '@/components/dashboard/full-weekly-calendar';
import { getCalendarAppointments } from '@/server/queries/appointment-calendar';
import { requireSession } from '@/lib/auth/require-session';

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireSession({ redirectToLogin: true });
  const params = await searchParams;
  const now = new Date();
  // For the initial load we still fetch by month to get enough data for the weekly view
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? '')
    ? params.month!
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const appointments = await getCalendarAppointments(month);

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col gap-6">
      <DashboardPageHeader
        title="Jadwal Terapi (Calendar View)"
        description="Pantau dan kelola jadwal sesi terapi mingguan secara detail."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Jadwal', href: '/dashboard/appointments' },
          { label: 'Kalender' },
        ]}
        icon={<CalendarDays className="h-7 w-7 text-hafta-ylw-900" strokeWidth={2.25} />}
      />

      <div className="flex flex-1 min-h-0 flex-col">
        <FullWeeklyCalendar appointments={appointments} />
      </div>
    </div>
  );
}
