import Link from 'next/link';
import { CalendarDays, Clock3, Plus, UserRound } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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
import { AppointmentCard } from "@/components/dashboard/appointment-card";
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { getScopedAppointments } from '@/server/queries/appointments';

const typeLabel = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Tindak Lanjut',
  EVALUATION: 'Evaluasi',
} as const;
const statusLabel = {
  SCHEDULED: 'Terjadwal',
  CONFIRMED: 'Terkonfirmasi',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  RESCHEDULED: 'Dijadwalkan Ulang',
  NO_SHOW: 'Tidak Hadir',
} as const;

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.APPOINTMENT_LIST);
  const { page } = await searchParams;
  const result = await getScopedAppointments(Number(page) || 1);
  const canCreate = hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Appointment' }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Appointment</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {role === 'USER' ? 'Jadwal terapi yang tersedia untuk Anda.' : 'Kelola jadwal terapi sesuai wewenang Anda.'}
          </p>
        </div>
        {canCreate ? (
          <Link href="/dashboard/appointments/new" className={cn(buttonVariants({ size: 'lg' }))}>
            <Plus /> Buat Appointment
          </Link>
        ) : null}
      </div>
      {result.items.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" />
            </span>
            <h2 className="mt-4 font-semibold text-foreground">Belum ada jadwal terapi</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Appointment akan tampil di sini setelah jadwal dibuat oleh petugas berwenang.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Menampilkan {(result.currentPage - 1) * 6 + 1}–{Math.min(result.currentPage * 6, result.total)} dari{' '}
            {result.total} jadwal
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {result.items.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} role={role} />
            ))}
          </div>
          {result.totalPages > 1 ? (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  {result.currentPage > 1 ? (
                    <PaginationPrevious href={`/dashboard/appointments?page=${result.currentPage - 1}`}>
                      Sebelumnya
                    </PaginationPrevious>
                  ) : null}
                </PaginationItem>
                {Array.from({ length: result.totalPages }, (_, index) => index + 1).map((item) => (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href={`/dashboard/appointments?page=${item}`}
                      isActive={item === result.currentPage}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  {result.currentPage < result.totalPages ? (
                    <PaginationNext href={`/dashboard/appointments?page=${result.currentPage + 1}`}>
                      Berikutnya
                    </PaginationNext>
                  ) : null}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      )}
    </div>
  );
}
