import { Users } from 'lucide-react';
import { CreatePatientFormModal } from '@/components/dashboard/create-patient-form-modal';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PatientTableClient } from '@/components/dashboard/patients/patient-table-client';
import { PatientListFilters } from '@/components/dashboard/patient-list-filters';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { getPatientsList, getTherapistOptions, getUnlinkedUserPatients } from '@/server/queries/patients';

function buildHrefTemplate(search: string, status: string, therapist: string, perPage: number) {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (status) params.set('status', status);
  if (therapist) params.set('therapist', therapist);
  params.set('perPage', String(perPage));
  return `/dashboard/patients?${params.toString()}&page={page}`;
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    therapist?: string;
    perPage?: string;
  }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.PATIENT_LIST);
  const params = await searchParams;
  const search = params.q?.trim() ?? '';
  const status = params.status ?? '';
  const therapist = params.therapist ?? '';
  const perPageParam = Number(params.perPage);
  const perPage = [4, 10, 25, 50].includes(perPageParam) ? perPageParam : 4;
  const [result, therapistOptions] = await Promise.all([
    getPatientsList(Number(params.page) || 1, perPage, search, status, therapist),
    getTherapistOptions(),
  ]);
  const canCreate = hasPermission(role, PERMISSIONS.PATIENT_CREATE);
  const canArchive = hasPermission(role, PERMISSIONS.PATIENT_ARCHIVE);
  const unlinkedUsers = canCreate ? await getUnlinkedUserPatients() : [];

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Daftar Pasien"
        description="Pasien yang sudah terhubung dengan akun portal."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pasien' },
        ]}
        icon={<Users className="h-6 w-6 text-[var(--hafta-org-100)]" />}
        action={
          canCreate ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
              <CreatePatientFormModal
              userOptions={unlinkedUsers.map((u) => ({ id: u.id, name: u.name, email: u.email }))}
              buttonClassName={cn(
                'h-11 px-3 sm:px-5 rounded-full bg-[var(--hafta-org-100)] hover:bg-[var(--hafta-org-200)] border border-transparent text-[#181700] text-xs sm:text-[13px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0'
              )}
              />
            </div>
          ) : null
        }
      />

      <div className="space-y-3">
        <PatientListFilters
          initialSearch={search}
          initialStatus={status}
          initialTherapist={therapist}
          therapistOptions={therapistOptions}
        />
      </div>

      {result.items.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white p-3.5 text-center sm:p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
            <Users className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#181700]">Tidak ada pasien ditemukan</p>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            Ubah pencarian atau filter, atau tambahkan akun USER sebagai pasien.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-stone-500 sm:text-[13px]">
            Menampilkan {(result.currentPage - 1) * perPage + 1}–{Math.min(result.currentPage * perPage, result.total)} dari{' '}
            {result.total} pasien
          </p>
          <PatientTableClient
            items={result.items}
            currentPage={result.currentPage}
            pageSize={perPage}
            canArchive={canArchive}
          />
          <PaginationBar
            page={result.currentPage}
            pageCount={result.totalPages}
            hrefTemplate={buildHrefTemplate(search, status, therapist, perPage)}
            pageSize={perPage}
            pageSizeOptions={[4, 10, 25, 50]}
            pageSizeHrefTemplate={buildHrefTemplate(search, status, therapist, 0)
              .replace('perPage=0', 'perPage={size}')
              .replace('page={page}', 'page=1')}
            className="mt-4"
          />
        </div>
      )}
    </div>
  );
}
