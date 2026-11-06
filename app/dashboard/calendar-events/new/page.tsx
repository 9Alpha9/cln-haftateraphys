import Link from 'next/link';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { InternalCalendarEventForm } from '@/components/dashboard/internal-calendar-event-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';

export default async function NewCalendarEventPage() {
  await requirePermission(PERMISSIONS.CALENDAR_EVENT_MANAGE);
  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Tambah Event Kalender"
        description="Buat libur klinik, pelatihan, atau kegiatan internal."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tambah Event' }]}
        icon={<CalendarPlus className="h-6 w-6" />}
        action={
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-stone-200/90 bg-white px-4 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100 sm:w-auto sm:px-5 sm:text-[13px]"
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
