import Link from 'next/link';
import { CalendarDays, LayoutList, Plus, Search, Filter } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AppointmentCard } from '@/components/dashboard/appointment-card';
import { NewAppointmentButton } from '@/components/dashboard/appointments/new-appointment-button';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { getScopedAppointments } from '@/server/queries/appointments';
import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';
import { PatientTherapyCalendar } from '@/components/patient/patient-therapy-calendar';
import {
  getPatientAppointmentRequests,
  getPatientBookingAvailability,
  getPatientPortalAppointments,
  getPendingAppointmentRequests,
} from '@/server/queries/patient-portal';
import { AppointmentRequestQueue } from '@/components/dashboard/appointment-request-queue';
import { getIndonesianHolidays } from '@/server/queries/indonesian-holidays';
import { getTherapistScheduleOverview } from '@/server/queries/therapist-schedules';
import { TherapistSchedulePanel } from '@/components/dashboard/therapist-schedule-panel';

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
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
      <div className="space-y-6">
        <DashboardPageHeader
          title="Jadwal Terapi"
          description="Lihat sesi terapi Anda, temukan slot fisioterapis yang tersedia, lalu ajukan jadwal baru. Pengajuan akan dikonfirmasi oleh tim Hafta."
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Jadwal' }]}
        />
        <PatientTherapyCalendar
          appointments={appointments}
          availability={availability}
          requests={requests}
          holidays={holidays}
        />
      </div>
    );
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const activeStatus = params.status || 'ALL';
  const query = params.q?.trim().toLowerCase() || '';

  const canCreate = hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE);
  const canReview = hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE);
  const canManageSchedule =
    hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE) ||
    hasPermission(role, PERMISSIONS.SETTINGS_MANAGE);
  const [result, formOptions, pendingRequests, scheduleOverview] = await Promise.all([
    getScopedAppointments(page, 20),
    canCreate
      ? getAppointmentFormOptions().catch(() => ({ patientOptions: [], therapistOptions: [] }))
      : Promise.resolve({ patientOptions: [], therapistOptions: [] }),
    canReview ? getPendingAppointmentRequests().catch(() => []) : Promise.resolve([]),
    canManageSchedule ? getTherapistScheduleOverview().catch(() => []) : Promise.resolve([]),
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
    ALL: result.items.length,
    SCHEDULED: result.items.filter((i) => i.status === 'SCHEDULED').length,
    COMPLETED: result.items.filter((i) => i.status === 'COMPLETED').length,
    CANCELLED: result.items.filter((i) => i.status === 'CANCELLED').length,
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Jadwal Terapi"
        description="Kelola jadwal janji temu dan pantau ketersediaan sesi terapi."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Jadwal' },
        ]}
        icon={<CalendarDays className="h-6 w-6 text-[var(--hafta-ylw-100)]" />}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {scheduleOverview.length > 0 ? (
              <TherapistSchedulePanel
                therapists={scheduleOverview}
                label={role === 'THERAPIST' ? 'Jadwal Kerja Saya' : 'Jadwal Kerja Terapis'}
              />
            ) : null}

            {/* View Switcher */}
            <div className="flex items-center rounded-xl border border-stone-200 bg-white p-1 shadow-2xs">
              <Link
                href="/dashboard/appointments"
                className="flex items-center gap-1.5 rounded-lg bg-[var(--hafta-ylw-100)] px-3 py-1.5 text-xs font-bold text-[#181700] shadow-2xs"
              >
                <LayoutList className="h-3.5 w-3.5" /> List
              </Link>
              <Link
                href="/dashboard/calendar"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-500 hover:text-[#181700]"
              >
                <CalendarDays className="h-3.5 w-3.5" /> Kalender
              </Link>
            </div>

            {canCreate ? (
              <NewAppointmentButton
                patientOptions={formOptions.patientOptions}
                therapistOptions={formOptions.therapistOptions}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-4 py-2 text-xs font-bold text-[#181700] shadow-2xs transition-all hover:bg-[var(--hafta-ylw-200)]"
              >
                <Plus className="h-4 w-4" /> Buat Appointment
              </NewAppointmentButton>
            ) : null}
          </div>
        }
      />

      {canReview ? <AppointmentRequestQueue requests={pendingRequests} /> : null}

      {/* ── FILTER & CONTROL TOOLBAR ── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <Link
            href="/dashboard/appointments?status=ALL"
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap',
              activeStatus === 'ALL'
                ? 'bg-[#181700] text-white shadow-2xs'
                : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            )}
          >
            Semua ({countByStatus.ALL})
          </Link>
          <Link
            href="/dashboard/appointments?status=SCHEDULED"
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap',
              activeStatus === 'SCHEDULED'
                ? 'bg-[#181700] text-white shadow-2xs'
                : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            )}
          >
            Terjadwal ({countByStatus.SCHEDULED})
          </Link>
          <Link
            href="/dashboard/appointments?status=COMPLETED"
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap',
              activeStatus === 'COMPLETED'
                ? 'bg-[#181700] text-white shadow-2xs'
                : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            )}
          >
            Selesai ({countByStatus.COMPLETED})
          </Link>
          <Link
            href="/dashboard/appointments?status=CANCELLED"
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap',
              activeStatus === 'CANCELLED'
                ? 'bg-[#181700] text-white shadow-2xs'
                : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            )}
          >
            Dibatalkan ({countByStatus.CANCELLED})
          </Link>
        </div>

        {/* Info Ringkas */}
        <p className="text-xs font-medium text-stone-500">
          Menampilkan {filteredItems.length} jadwal sesi
        </p>
      </div>

      {/* ── APPOINTMENT GRID LAYOUT (MODERN STRUCTURED CARDS) ── */}
      {filteredItems.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-stone-200 bg-white">
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-ylw-50)] text-[#181700]">
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
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} role={role} />
            ))}
          </div>

          {result.totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/dashboard/appointments?page=${Math.max(1, result.currentPage - 1)}&status=${activeStatus}`}
                      aria-disabled={result.currentPage <= 1}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href={`/dashboard/appointments?page=${Math.min(result.totalPages, result.currentPage + 1)}&status=${activeStatus}`}
                      aria-disabled={result.currentPage >= result.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
