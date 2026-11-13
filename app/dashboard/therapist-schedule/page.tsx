import { CalendarClock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { TherapistScheduleManager } from '@/components/dashboard/therapist-schedule-manager';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getTherapistScheduleOverview } from '@/server/queries/therapist-schedules';

export const dynamic = 'force-dynamic';

export default async function TherapistSchedulePage() {
  const { role } = await requireSession({ redirectToLogin: true });
  if (
    !hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE) &&
    !hasPermission(role, PERMISSIONS.SETTINGS_MANAGE)
  ) {
    notFound();
  }

  const therapists = await getTherapistScheduleOverview();

  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <DashboardPageHeader
        title="Jadwal Kerja"
        description="Atur jam kerja mingguan dan blokir tanggal untuk fisioterapis."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Jadwal Kerja' }]}
        icon={<CalendarClock className="h-6 w-6" />}
      />
      <TherapistScheduleManager therapists={therapists} formId="therapist-schedule-form" />
    </div>
  );
}
