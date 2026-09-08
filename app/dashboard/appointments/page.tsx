import Link from 'next/link';
import { CalendarDays, LayoutList, Plus } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AppointmentCard } from '@/components/dashboard/appointment-card';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { getScopedAppointments } from '@/server/queries/appointments';

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.APPOINTMENT_LIST);
  const { page } = await searchParams;

  const canCreate = hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE);
  const result = await getScopedAppointments(Number(page) || 1);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Jadwal Terapi"
        description={
          role === 'USER'
            ? 'Jadwal terapi yang tersedia untuk Anda.'
            : 'Kelola dan atur jadwal janji temu terapi sesuai wewenang Anda.'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Jadwal' },
        ]}
        icon={<CalendarDays className="h-7 w-7 text-hafta-ylw-900" strokeWidth={2.25} />}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-1 shadow-2xs">
              <Link
                href={`/dashboard/appointments`}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  'bg-white text-[#111827] shadow-xs'
                )}
              >
                <LayoutList className="h-3.5 w-3.5" /> List
              </Link>
              <Link
                href={`/dashboard/calendar`}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  'text-[#6B7280] hover:text-[#111827]'
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" /> Kalender
              </Link>
            </div>

            {canCreate ? (
              <Link
                href="/dashboard/appointments/new"
                className={cn(
                  buttonVariants({ size: 'default' }),
                  'bg-hafta-ylw-200 text-hafta-ylw-900 hover:bg-hafta-ylw-300 font-semibold rounded-xl shadow-xs'
                )}
              >
                <Plus className="h-4 w-4 mr-1" /> Buat Appointment
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="space-y-4">
        <p className="text-xs font-medium text-[#6B7280]">
          Menampilkan {(result.currentPage - 1) * 6 + 1}–{Math.min(result.currentPage * 6, result.total)} dari{' '}
          {result.total} jadwal terapi
        </p>

        {result.items.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-[#E5E7EB]">
            <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-hafta-ylw-50 text-hafta-ylw-700">
                <CalendarDays className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-base font-bold text-[#111827]">Belum ada jadwal terapi</h2>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[#6B7280]">
                Appointment akan tampil di sini setelah jadwal dibuat oleh petugas berwenang.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {result.items.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} role={role} />
              ))}
            </div>

            {result.totalPages > 1 ? (
              <div className="flex justify-center pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={`/dashboard/appointments?page=${Math.max(1, result.currentPage - 1)}`}
                        aria-disabled={result.currentPage <= 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href={`/dashboard/appointments?page=${pageNumber}`}
                          isActive={pageNumber === result.currentPage}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href={`/dashboard/appointments?page=${Math.min(result.totalPages, result.currentPage + 1)}`}
                        aria-disabled={result.currentPage >= result.totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
