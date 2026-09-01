import { ClipboardList } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IntakeTableActions } from '@/components/dashboard/intake-table-actions';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getReviewableIntakes } from '@/server/queries/intake-review';

const statusLabel = {
  SUBMITTED: 'Terkirim',
  UNDER_REVIEW: 'Sedang Ditinjau',
  NEEDS_REVISION: 'Perlu Perbaikan',
  ACCEPTED: 'Diterima',
  ARCHIVED: 'Diarsipkan',
} as const;
function hrefFor(page: number, search: string, status: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set('q', search);
  if (status) params.set('status', status);
  return `/dashboard/intake?${params.toString()}`;
}

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  await requirePermission(role === 'USER' ? PERMISSIONS.INTAKE_CREATE_OWN : PERMISSIONS.INTAKE_READ);
  if (role === 'USER') {
    const { default: PatientIntakePage } = await import('@/app/dashboard/intake/patient-page');
    return <PatientIntakePage />;
  }

  const params = await searchParams;
  const search = params.q?.trim() ?? '';
  const status = params.status ?? '';
  const result = await getReviewableIntakes(Number(params.page) || 1, 10, search, status);
  const canArchive = hasPermission(role, PERMISSIONS.INTAKE_ARCHIVE);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Intake' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Intake</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Form Awal pasien yang telah dikirim untuk ditinjau.
        </p>
      </div>
      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Daftar Intake</CardTitle>
          <form className="grid gap-3 sm:grid-cols-[1fr_11rem_auto]">
            <input
              name="q"
              defaultValue={search}
              placeholder="Cari nama pasien"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">Semua status</option>
              <option value="SUBMITTED">Terkirim</option>
              <option value="UNDER_REVIEW">Sedang Ditinjau</option>
              <option value="NEEDS_REVISION">Perlu Perbaikan</option>
              <option value="ACCEPTED">Diterima</option>
              <option value="ARCHIVED">Diarsipkan</option>
            </select>
            <button className={cn(buttonVariants({ variant: 'outline' }))}>Terapkan</button>
          </form>
        </CardHeader>
        <CardContent>
          {result.items.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <ClipboardList className="h-10 w-10 text-[#92400e]/70" />
              <p className="mt-4 font-semibold text-foreground">Tidak ada intake ditemukan</p>
              <p className="mt-2 text-sm text-muted-foreground">Ubah pencarian atau filter status.</p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                Menampilkan {(result.currentPage - 1) * 10 + 1}–{Math.min(result.currentPage * 10, result.total)} dari{' '}
                {result.total} intake
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">No.</TableHead>
                    <TableHead>Pasien</TableHead>
                    <TableHead className="hidden sm:table-cell">Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Diperbarui</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((intake, index) => (
                    <TableRow key={intake.id}>
                      <TableCell className="text-muted-foreground">
                        {(result.currentPage - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">{intake.patientName}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {intake.affectedArea || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-[#92400e]">
                          {statusLabel[intake.status as keyof typeof statusLabel]}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {intake.updatedAt.toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <IntakeTableActions
                          patientId={intake.patientId}
                          canArchive={canArchive && intake.status !== 'ARCHIVED'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {result.totalPages > 1 ? (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      {result.currentPage > 1 ? (
                        <PaginationPrevious href={hrefFor(result.currentPage - 1, search, status)}>
                          Sebelumnya
                        </PaginationPrevious>
                      ) : null}
                    </PaginationItem>
                    {Array.from({ length: result.totalPages }, (_, index) => index + 1).map((item) => (
                      <PaginationItem key={item}>
                        <PaginationLink href={hrefFor(item, search, status)} isActive={item === result.currentPage}>
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      {result.currentPage < result.totalPages ? (
                        <PaginationNext href={hrefFor(result.currentPage + 1, search, status)}>
                          Berikutnya
                        </PaginationNext>
                      ) : null}
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
