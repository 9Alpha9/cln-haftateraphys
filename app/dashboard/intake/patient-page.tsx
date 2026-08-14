import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientIntakeForm } from '@/components/patient/patient-intake-form';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getCurrentPatientIntake } from '@/server/queries/patient-intakes';

export default async function PatientIntakePage() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.INTAKE_CREATE_OWN);
  if (role !== 'USER') return null;

  const intake = await getCurrentPatientIntake(session.user.id);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardPageHeader
        title="Form Awal"
        description="Informasi ini dikirim ke tim Hafta untuk ditinjau. Form ini tidak menggantikan assessment oleh tenaga berwenang."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Form Awal' }]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Informasi untuk Intake</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientIntakeForm
            status={intake?.status ?? null}
            initialValues={
              intake
                ? {
                    chiefComplaint: intake.chiefComplaint ?? '',
                    affectedArea: intake.affectedArea ?? '',
                    onsetDescription: intake.onsetDescription ?? '',
                    triggeringEvent: intake.triggeringEvent ?? '',
                    aggravatingFactors: intake.aggravatingFactors ?? '',
                    relievingFactors: intake.relievingFactors ?? '',
                    dailyLimitations: intake.dailyLimitations ?? '',
                    previousInjuryHistory: intake.previousInjuryHistory ?? '',
                    surgeryHistory: intake.surgeryHistory ?? '',
                    relevantMedicalHistory: intake.relevantMedicalHistory ?? '',
                    currentMedication: intake.currentMedication ?? '',
                    allergies: intake.allergies ?? '',
                    patientGoal: intake.patientGoal ?? '',
                    dataAccuracyAcknowledged: intake.dataAccuracyAcknowledged === 1,
                  }
                : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
