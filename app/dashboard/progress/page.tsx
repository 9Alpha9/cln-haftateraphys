import { Activity } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getOwnMedicalRecordSummary, getScopedTherapyProgress } from '@/server/queries/therapy-progress';
import { PatientMedicalRecordView } from '@/components/patient/patient-medical-record-view';
import { ProgressManagementView } from '@/components/dashboard/progress/progress-management-view';
import { NewMedicalRecordButton } from '@/components/dashboard/progress/new-medical-record-button';
import { getPatientSelectOptions } from '@/server/queries/patients';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: 'DRAFT' | 'FINALIZED' | ''; visible?: string }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  const isPatient = role === 'USER';
  const canCreate = hasPermission(role, PERMISSIONS.PROGRESS_READ) && !isPatient;

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.q?.trim() ?? '';
  const status = params.status ?? '';
  const visible = params.visible === 'true' ? true : params.visible === 'false' ? false : '';

  // Parallel fetching untuk menghindari waterfall
  const [{ items: records, totalPages, currentPage }, patientSummary, patientOptions] = await Promise.all([
    getScopedTherapyProgress({
      page,
      pageSize: isPatient ? 50 : 12,
      search,
      status,
      patientVisible: visible,
    }),
    isPatient ? getOwnMedicalRecordSummary() : Promise.resolve(null),
    !isPatient && canCreate ? getPatientSelectOptions() : Promise.resolve([]),
  ]);

  const buildUrl = (pageNumber: number) => {
    const p = new URLSearchParams();
    p.set('page', String(pageNumber));
    if (search) p.set('q', search);
    if (status) p.set('status', status);
    if (params.visible) p.set('visible', params.visible);
    return `/dashboard/progress?${p.toString()}`;
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* ── 1. GLOBAL ARCHITECTURAL NON-ROUNDED HEADER ── */}
      <DashboardPageHeader
        title="Rekam Medis Pasien"
        description={
          isPatient
            ? 'Ringkasan evaluasi perkembangan terapi yang dibagikan oleh fisioterapis Anda.'
            : 'Kelola catatan klinis terstruktur (SOAP) dan pantau perkembangan fungsional pasien. Finalisasi rekam berbeda dari status sesi Selesai di menu Jadwal.'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Rekam Medis' }]}
        icon={<Activity className="h-6 w-6 text-[var(--hafta-ylw-100)]" />}
        action={
          canCreate ? <NewMedicalRecordButton patientOptions={patientOptions} /> : undefined
        }
      />

      {/* ── 2. ROLE-BASED VIEW ── */}
      {isPatient ? (
        <PatientMedicalRecordView patient={patientSummary} records={records} />
      ) : (
        <>
          <ProgressManagementView
            initialRecords={records}
            canEdit={canCreate}
            patientOptions={patientOptions}
          />

          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={currentPage > 1 ? buildUrl(currentPage - 1) : '#'}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNumber) => (
                    <PaginationItem key={pNumber}>
                      <PaginationLink href={buildUrl(pNumber)} isActive={currentPage === pNumber}>
                        {pNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href={currentPage < totalPages ? buildUrl(currentPage + 1) : '#'}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
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
