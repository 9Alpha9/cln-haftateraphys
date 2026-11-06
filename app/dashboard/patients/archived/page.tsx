import { Archive } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { PatientListTabs } from '@/components/dashboard/patient-list-tabs';
import { ArchivedPatientList } from '@/components/dashboard/patients/archived-patient-list';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getArchivedPatientsList } from '@/server/queries/patients';

function buildHrefTemplate(search: string, perPage: number) {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  params.set('perPage', String(perPage));
  return `/dashboard/patients/archived?${params.toString()}&page={page}`;
}

export default async function ArchivedPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; perPage?: string }>;
}) {
  await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.PATIENT_LIST);
  const params = await searchParams;
  const search = params.q?.trim() ?? '';
  const perPageParam = Number(params.perPage);
  const perPage = [4, 10, 25, 50].includes(perPageParam) ? perPageParam : 4;
  const result = await getArchivedPatientsList(Number(params.page) || 1, perPage, search);

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Pasien Diarsipkan"
        description="Data pasien yang telah diarsipkan oleh terapis. Pulihkan pasien untuk mengaktifkannya kembali."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pasien', href: '/dashboard/patients' },
          { label: 'Diarsipkan' },
        ]}
        icon={<Archive className="h-6 w-6 text-[var(--hafta-ylw-100)]" />}
      />

      <PatientListTabs active="archived" />

      {result.items.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white p-3.5 text-center sm:p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-ylw-50)] text-[#181700]">
            <Archive className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#181700]">Tidak ada pasien diarsipkan</p>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            Belum ada data pasien yang diarsipkan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-stone-500 sm:text-[13px]">
            Menampilkan {(result.currentPage - 1) * perPage + 1}–{Math.min(result.currentPage * perPage, result.total)} dari{' '}
            {result.total} pasien
          </p>
          <ArchivedPatientList items={result.items} />
          <PaginationBar
            page={result.currentPage}
            pageCount={result.totalPages}
            hrefTemplate={buildHrefTemplate(search, perPage)}
            pageSize={perPage}
            pageSizeOptions={[4, 10, 25, 50]}
            pageSizeHrefTemplate={buildHrefTemplate(search, 0).replace('perPage=0', 'perPage={size}').replace('page={page}', 'page=1')}
            className="mt-4"
          />
        </div>
      )}
    </div>
  );
}
