import { CalendarDays } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { TherapyCalendarView } from '@/components/dashboard/appointments/therapy-calendar-view';
import { getCalendarAppointmentsRange } from '@/server/queries/appointment-calendar';
import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { requireSession } from '@/lib/auth/require-session';

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  const params = await searchParams;
  const now = new Date();
  const year = /^\d{4}$/.test(params.month ?? '') ? Number(params.month) : now.getFullYear();
  const start = `${year - 1}-01-01`;
  const end = `${year + 2}-12-31`;
  const canCreate = role !== 'USER' && hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE);
  const canComplete = role !== 'USER' && hasPermission(role, PERMISSIONS.APPOINTMENT_COMPLETE);

  const [appointments, formOptions] = await Promise.all([
    getCalendarAppointmentsRange(start, end),
    canCreate
      ? getAppointmentFormOptions().catch(() => ({ patientOptions: [], therapistOptions: [] }))
      : Promise.resolve({ patientOptions: [], therapistOptions: [] }),
  ]);

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
        <TherapyCalendarView
          appointments={appointments}
          patientOptions={formOptions.patientOptions}
          therapistOptions={formOptions.therapistOptions}
          canCreate={canCreate}
          canComplete={canComplete}
        />
      </div>
    </div>
  );
}
