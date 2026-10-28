import { Archive } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
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
import { PatientListTabs } from '@/components/dashboard/patient-list-tabs';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { getArchivedPatientsList } from '@/server/queries/patients';

function hrefFor(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set('q', search);
  return `/dashboard/patients/archived?${params.toString()}`;
}

export default async function ArchivedPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.PATIENT_LIST);
  const params = await searchParams;
  const search = params.q?.trim() ?? '';
  const result = await getArchivedPatientsList(Number(params.page) || 1, 10, search);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Pasien Diarsipkan"
        description="Data pasien yang telah diarsipkan oleh terapis."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pasien', href: '/dashboard/patients' },
          { label: 'Diarsipkan' },
        ]}
        icon={<Archive className="h-6 w-6 text-[var(--hafta-ylw-100)]" />}
      />

      <div>
        <Card className="rounded-2xl border-stone-200/90 shadow-sm overflow-visible">
          <CardHeader className="gap-4">
            <PatientListTabs active="archived" />
          </CardHeader>
          <CardContent>
            {result.items.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <Archive className="h-10 w-10 text-[#92400e]/70" />
                <p className="mt-4 font-semibold text-foreground">Tidak ada pasien diarsipkan</p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Belum ada data pasien yang diarsipkan.
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
                      <TableHead className="hidden sm:table-cell">Diarsipkan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.items.map((patient, index) => (
                      <TableRow key={patient.id}>
                        <TableCell className="text-muted-foreground">
                          {(result.currentPage - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-foreground">{patient.fullName}</span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-[#92400e]">
                            {patient.caseStatus}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {patient.createdAt.toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {patient.archivedAt?.toLocaleDateString('id-ID') ?? '-'}
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
                          <PaginationPrevious href={hrefFor(result.currentPage - 1, search)}>
                            Sebelumnya
                          </PaginationPrevious>
                        ) : null}
                      </PaginationItem>
                      {Array.from({ length: result.totalPages }, (_, index) => index + 1).map((item) => (
                        <PaginationItem key={item}>
                          <PaginationLink href={hrefFor(item, search)} isActive={item === result.currentPage}>
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        {result.currentPage < result.totalPages ? (
                          <PaginationNext href={hrefFor(result.currentPage + 1, search)}>
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
    </div>
  );
}
