import Link from 'next/link';
import { CalendarDays, LayoutList, Plus, Search, Filter } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppointmentCard } from '@/components/dashboard/appointment-card';
import { NewAppointmentButton } from '@/components/dashboard/appointments/new-appointment-button';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { getScopedAppointments } from '@/server/queries/appointments';
import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';
import { PatientTherapyCalendar } from '@/components/patient/patient-therapy-calendar';
import { PatientSessionList } from '@/components/patient/patient-session-list';
import {
  getPatientAppointmentRequests,
  getPatientBookingAvailability,
  getPatientPortalAppointments,
  getPendingAppointmentRequests,
} from '@/server/queries/patient-portal';
import { AppointmentRequestQueue } from '@/components/dashboard/appointment-request-queue';
import { getIndonesianHolidays } from '@/server/queries/indonesian-holidays';
import { AppointmentStatusFilter } from '@/components/dashboard/appointments/appointment-status-filter';
import { PaginationBar } from '@/components/ui/pagination-bar';

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string; perPage?: string }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.APPOINTMENT_LIST);

  if (role === 'USER') {
    const [appointments, requests, availability, holidays] = await Promise.all([
      getPatientPortalAppointments(),
      getPatientAppointmentRequests(),
      getPatientBookingAvailability(),
      getIndonesianHolidays(new Date().getFullYear()).catch(() => []),
    ]);

    return (
      <div className="space-y-4 pb-6 sm:space-y-5">
        <DashboardPageHeader
          title="Jadwal Terapi"
          description="Lihat sesi terapi Anda, temukan slot fisioterapis yang tersedia, lalu ajukan jadwal baru. Pengajuan akan dikonfirmasi oleh tim Hafta."
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Jadwal' }]}
          icon={<CalendarDays className="h-6 w-6" />}
        />
        <PatientTherapyCalendar
          appointments={appointments}
          availability={availability}
          requests={requests}
          holidays={holidays}
          hideHeader
        />
        <PatientSessionList appointments={appointments} />
      </div>
    );
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const activeStatus = params.status || 'ALL';
  const query = params.q?.trim().toLowerCase() || '';
  const perPageParam = Number(params.perPage);
  const perPage = [4, 10, 25, 50].includes(perPageParam) ? perPageParam : 4;

  const canCreate = hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE);
  const canReview = hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE);
  const [result, formOptions, pendingRequests] = await Promise.all([
    getScopedAppointments(page, perPage),
    canCreate
      ? getAppointmentFormOptions().catch(() => ({ patientOptions: [], therapistOptions: [] }))
      : Promise.resolve({ patientOptions: [], therapistOptions: [] }),
    canReview ? getPendingAppointmentRequests().catch(() => []) : Promise.resolve([]),
  ]);

  // Filter lokal status & query
  const filteredItems = result.items.filter((item) => {
    if (activeStatus !== 'ALL' && item.status !== activeStatus) return false;
    if (query) {
      const matchName = item.patientName.toLowerCase().includes(query);
      const matchType = item.type.toLowerCase().includes(query);
      const matchTherapist = item.therapistName?.toLowerCase().includes(query) ?? false;
      if (!matchName && !matchType && !matchTherapist) return false;
    }
    return true;
  });

  const countByStatus = {
    ALL: result.total,
    SCHEDULED: result.statusCounts.SCHEDULED ?? 0,
    COMPLETED: result.statusCounts.COMPLETED ?? 0,
    CANCELLED: result.statusCounts.CANCELLED ?? 0,
  };

  return (
    <div className="space-y-4 pb-6 sm:space-y-5">
      <DashboardPageHeader
        title="Jadwal Terapi"
        description="Kelola jadwal janji temu dan pantau ketersediaan sesi terapi."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Jadwal' },
        ]}
        icon={<CalendarDays className="h-6 w-6 text-[var(--hafta-org-100)]" />}
        action={
          <div className="flex w-full items-center justify-between gap-2.5 sm:w-auto">
            {canCreate ? (
              <NewAppointmentButton
                patientOptions={formOptions.patientOptions}
                therapistOptions={formOptions.therapistOptions}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--hafta-org-100)] px-4 sm:px-5 text-xs font-bold text-[#181700]  transition-all hover:bg-[var(--hafta-org-200)] sm:text-[13px]"
              >
                <Plus className="h-4 w-4" /> Buat Appointment
              </NewAppointmentButton>
            ) : (
              <span />
            )}
          </div>
        }
      />

      {canReview ? <AppointmentRequestQueue requests={pendingRequests} /> : null}

      <AppointmentStatusFilter activeStatus={activeStatus} counts={countByStatus} />

      {/* ── APPOINTMENT GRID LAYOUT (MODERN STRUCTURED CARDS) ── */}
      {filteredItems.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-stone-200 bg-white ring-0 -none">
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center p-3.5 sm:p-5 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
              <CalendarDays className="h-6 w-6" />
            </span>
            <h2 className="mt-3 text-sm font-bold text-[#181700]">Tidak ada jadwal yang sesuai</h2>
            <p className="mt-1 max-w-sm text-xs text-stone-500">
              Ubah filter status atau buat appointment baru melalui tombol di atas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full">
            {filteredItems.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} role={role} />
            ))}
          </div>

          <PaginationBar
            page={result.currentPage}
            pageCount={result.totalPages}
            hrefTemplate={`/dashboard/appointments?page={page}&perPage=${perPage}&status=${activeStatus}`}
            pageSize={perPage}
            pageSizeOptions={[4, 10, 25, 50]}
            pageSizeHrefTemplate={`/dashboard/appointments?page=1&perPage={size}&status=${activeStatus}`}
          />
        </>
      )}
    </div>
  );
}
