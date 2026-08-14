import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { IntakeReviewActions } from '@/components/dashboard/intake-review-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getScopedIntakeForReview } from '@/server/queries/intake-review';

const fields = [
  ['Keluhan utama', 'chiefComplaint'],
  ['Area yang dikeluhkan', 'affectedArea'],
  ['Awal keluhan', 'onsetDescription'],
  ['Pemicu', 'triggeringEvent'],
  ['Keterbatasan aktivitas', 'dailyLimitations'],
  ['Target pasien', 'patientGoal'],
  ['Riwayat cedera', 'previousInjuryHistory'],
  ['Riwayat operasi', 'surgeryHistory'],
  ['Riwayat medis relevan', 'relevantMedicalHistory'],
  ['Obat saat ini', 'currentMedication'],
  ['Alergi', 'allergies'],
] as const;

export default async function PatientIntakeReviewPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const { role } = await requireSession({ redirectToLogin: true });
  const intake = await getScopedIntakeForReview(patientId);

  if (!intake)
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardPageHeader
          title="Form Awal"
          description="Belum ada Form Awal yang dapat ditinjau."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Pasien', href: '/dashboard/patients' },
            { label: 'Form Awal' },
          ]}
        />
      </div>
    );
  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardPageHeader
          title={`Form Awal · ${intake.patientName}`}
          description={`Status: ${intake.status}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Pasien', href: '/dashboard/patients' },
            { label: 'Form Awal' },
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pasien</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {fields.map(([label, key]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {intake[key] || 'Tidak diisi'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        {intake.reviewMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>Pesan untuk pasien</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{intake.reviewMessage}</p>
            </CardContent>
          </Card>
        ) : null}
        <IntakeReviewActions
          patientId={patientId}
          status={intake.status}
          canReview={hasPermission(role, PERMISSIONS.INTAKE_REVIEW)}
          canRequestRevision={hasPermission(role, PERMISSIONS.INTAKE_REQUEST_REVISION)}
          canAccept={hasPermission(role, PERMISSIONS.INTAKE_ACCEPT)}
        />
      </div>
    </>
  );
}
