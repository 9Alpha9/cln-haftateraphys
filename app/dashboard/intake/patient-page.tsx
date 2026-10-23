import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PatientIntakePortal } from '@/components/patient/patient-intake-portal';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getPatientVisibleIntakeHistory } from '@/server/queries/patient-intakes';

export default async function PatientIntakePage() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.INTAKE_CREATE_OWN);
  if (role !== 'USER') return null;

  const history = await getPatientVisibleIntakeHistory(session.user.id);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Form Awal"
        description="Ceritakan keluhan Anda satu kali per episode. Informasi ini membantu fisioterapis menyiapkan asesmen di klinik dan tidak menggantikan pemeriksaan tenaga berwenang."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Form Awal' }]}
      />
      <PatientIntakePortal history={history} />
    </div>
  );
}
