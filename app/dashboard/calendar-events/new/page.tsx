import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { InternalCalendarEventForm } from '@/components/dashboard/internal-calendar-event-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';

export default async function NewCalendarEventPage() {
  await requirePermission(PERMISSIONS.CALENDAR_EVENT_MANAGE);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardPageHeader
        title="Tambah Event Kalender"
        description="Buat libur klinik, pelatihan, atau kegiatan internal."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tambah Event' }]}
        action={
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 text-sm font-semibold text-[#92400e] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Detail Event</CardTitle>
        </CardHeader>
        <CardContent>
          <InternalCalendarEventForm />
        </CardContent>
      </Card>
    </div>
  );
}
