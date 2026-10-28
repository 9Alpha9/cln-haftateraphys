import { Users } from 'lucide-react';
import { CreatePatientFormModal } from '@/components/dashboard/create-patient-form-modal';
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
import { PatientTableClient } from '@/components/dashboard/patients/patient-table-client';
import { PatientListFilters } from '@/components/dashboard/patient-list-filters';
import { PatientListTabs } from '@/components/dashboard/patient-list-tabs';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { getPatientsList, getUnlinkedUserPatients } from '@/server/queries/patients';

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
  const unlinkedUsers = canCreate ? await getUnlinkedUserPatients() : [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Daftar Pasien"
        description="Pasien yang sudah terhubung dengan akun portal."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pasien' },
        ]}
        icon={<Users className="h-6 w-6 text-[var(--hafta-ylw-100)]" />}
        action={
          canCreate ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
              <CreatePatientFormModal
              userOptions={unlinkedUsers.map((u) => ({ id: u.id, name: u.name, email: u.email }))}
              buttonClassName={cn(
                'h-11 px-3 sm:px-5 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] border border-transparent text-[#181700] text-xs sm:text-[13px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0'
              )}
              />
            </div>
          ) : null
        }
      />

      {/* Content */}
      <div>
        <Card className="rounded-2xl border-stone-200/90 shadow-sm overflow-visible">
          <CardHeader className="gap-4">
            <PatientListTabs active="active" />
            <PatientListFilters initialSearch={search} initialStatus={status} />
          </CardHeader>
          <CardContent>
            {result.items.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <Users className="h-10 w-10 text-[#92400e]/70" />
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
                <PatientTableClient
                  items={result.items}
                  currentPage={result.currentPage}
                  canArchive={canArchive}
                />
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
    </div>
  );
}
