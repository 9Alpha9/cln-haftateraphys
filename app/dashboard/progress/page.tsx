import { redirect } from 'next/navigation';
import { Activity } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { NewMedicalRecordButton } from '@/components/dashboard/progress/new-medical-record-button';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getOwnMedicalRecordSummary, getScopedTherapyProgress } from '@/server/queries/therapy-progress';
import { getOwnHomeProgram } from '@/server/queries/home-programs';
import { getOwnTreatmentPlan } from '@/server/queries/treatment-plans';
import { PatientMedicalRecordView } from '@/components/patient/patient-medical-record-view';
import { ProgressManagementView } from '@/components/dashboard/progress/progress-management-view';
import { getPatientSelectOptions } from '@/server/queries/patients';

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: 'DRAFT' | 'FINALIZED' | ''; visible?: string }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  const isPatient = role === 'USER';
  const canRead = hasPermission(role, isPatient ? PERMISSIONS.PROGRESS_READ_OWN : PERMISSIONS.PROGRESS_READ);
  if (!canRead) {
    redirect('/dashboard');
  }
  const canCreate = hasPermission(role, PERMISSIONS.PROGRESS_READ) && !isPatient;

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.q?.trim() ?? '';
  const status = params.status ?? '';
  const visible = params.visible === 'true' ? true : params.visible === 'false' ? false : '';

  // Parallel fetching untuk menghindari waterfall
  const [
    { items: records, totalPages, currentPage },
    patientSummary,
    patientOptions,
    homeProgram,
    treatmentPlan,
  ] = await Promise.all([
    getScopedTherapyProgress({
      page,
      pageSize: isPatient ? 50 : 12,
      search,
      status,
      patientVisible: visible,
    }),
    isPatient ? getOwnMedicalRecordSummary() : Promise.resolve(null),
    !isPatient && canCreate ? getPatientSelectOptions() : Promise.resolve([]),
    isPatient ? getOwnHomeProgram() : Promise.resolve(null),
    isPatient ? getOwnTreatmentPlan() : Promise.resolve(null),
  ]);

  const hrefTemplate = (() => {
    const p = new URLSearchParams();
    if (search) p.set('q', search);
    if (status) p.set('status', status);
    if (params.visible) p.set('visible', params.visible);
    const query = p.toString();
    return `/dashboard/progress?${query ? `${query}&` : ''}page={page}`;
  })();

  return (
    <div className="space-y-4 pb-6 sm:space-y-5">
      {/* ── 1. GLOBAL ARCHITECTURAL NON-ROUNDED HEADER ── */}
      <DashboardPageHeader
        title="Rekam Medis Pasien"
        description={
          isPatient
            ? 'Ringkasan evaluasi perkembangan terapi yang dibagikan oleh fisioterapis Anda.'
            : 'Kelola catatan klinis terstruktur (SOAP) dan pantau perkembangan fungsional pasien. Finalisasi rekam berbeda dari status sesi Selesai di menu Jadwal.'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Rekam Medis' }]}
        icon={<Activity className="h-6 w-6 text-[var(--hafta-org-100)]" />}
        action={
          !isPatient && canCreate ? (
            <NewMedicalRecordButton patientOptions={patientOptions} />
          ) : undefined
        }
      />

      {/* ── 2. ROLE-BASED VIEW ── */}
      {isPatient ? (
        <PatientMedicalRecordView
        patient={patientSummary}
        records={records}
        homeProgram={homeProgram}
        treatmentPlan={treatmentPlan}
      />
      ) : (
        <>
          <ProgressManagementView
            key={search}
            initialRecords={records}
            canEdit={canCreate}
            patientOptions={patientOptions}
            initialSearch={search}
          />

          {search.trim() && totalPages > 1 ? (
            <PaginationBar
              page={currentPage}
              pageCount={totalPages}
              hrefTemplate={hrefTemplate}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
