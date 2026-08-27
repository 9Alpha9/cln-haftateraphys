import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PatientTableActions } from '@/components/dashboard/patient-table-actions';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { getPatientsList } from '@/server/queries/patients';

function hrefFor(page: number, search: string, status: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set('q', search);
  if (status) params.set('status', status);
  return `/dashboard/patients?${params.toString()}`;
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.PATIENT_LIST);
  const params = await searchParams;
  const search = params.q?.trim() ?? '';
  const status = params.status ?? '';
  const result = await getPatientsList(Number(params.page) || 1, 10, search, status);
  const canCreate = hasPermission(role, PERMISSIONS.PATIENT_CREATE);
  const canArchive = hasPermission(role, PERMISSIONS.PATIENT_ARCHIVE);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pasien' }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Daftar Pasien</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Pasien yang sudah terhubung dengan akun portal.
          </p>
        </div>
        {canCreate ? (
          <div className="flex items-center gap-3">
            <Link href="/dashboard/patients/new" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Hubungkan Akun
            </Link>
            <Link href="/dashboard/users/add" className={cn(buttonVariants({ size: 'lg' }))}>
              <Plus /> Daftarkan Pasien
            </Link>
          </div>
        ) : null}
      </div>
      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Pasien Aktif</CardTitle>
          <form className="grid gap-3 sm:grid-cols-[1fr_11rem_auto]">
            <input
              name="q"
              defaultValue={search}
              placeholder="Cari nama pasien"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Select name="status" defaultValue={status}>
              <option value="">Semua status</option>
              <option value="INTAKE">Intake</option>
              <option value="ACTIVE">Aktif</option>
              <option value="ON_HOLD">Ditunda</option>
              <option value="COMPLETED">Selesai</option>
              <option value="REFERRED">Rujuk</option>
            </Select>
            <button className={cn(buttonVariants({ variant: 'outline' }))}>Terapkan</button>
          </form>
        </CardHeader>
        <CardContent>
          {result.items.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Users className="h-10 w-10 text-primary/70" />
              <p className="mt-4 font-semibold text-foreground">Tidak ada pasien ditemukan</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Ubah pencarian atau filter, atau tambahkan akun USER sebagai pasien.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                Menampilkan {(result.currentPage - 1) * 10 + 1}–{Math.min(result.currentPage * 10, result.total)} dari{' '}
                {result.total} pasien
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">No.</TableHead>
                    <TableHead>Nama Pasien</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Terdaftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((patient, index) => (
                    <TableRow key={patient.id}>
                      <TableCell className="text-muted-foreground">
                        {(result.currentPage - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">{patient.fullName}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {patient.caseStatus}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {patient.createdAt.toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <PatientTableActions patientId={patient.id} canArchive={canArchive} />
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
