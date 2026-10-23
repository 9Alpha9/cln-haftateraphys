import { ClipboardList } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { IntakeManagementTable } from '@/components/dashboard/intake/intake-management-table';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getReviewableIntakes } from '@/server/queries/intake-review';

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

  // Mengambil daftar intake lengkap untuk interaksi filter real-time
  const result = await getReviewableIntakes(Number(params.page) || 1, 50, search, status);
  const canArchive = hasPermission(role, PERMISSIONS.INTAKE_ARCHIVE);
  const canReview = hasPermission(role, PERMISSIONS.INTAKE_REVIEW);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Daftar Intake Pasien"
        description="Kelola dan verifikasi form asesmen awal pasien yang dikirim melalui Patient Portal."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Intake' },
        ]}
        icon={<ClipboardList className="h-6 w-6 text-[var(--hafta-ylw-100)]" />}
      />

      {/* Interactive Table with Integrated Slide-Over Drawer */}
      <IntakeManagementTable
        initialItems={result.items}
        canArchive={canArchive}
        canReview={canReview}
      />
    </div>
  );
}
