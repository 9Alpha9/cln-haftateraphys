import { PatientProfileForm } from '@/components/patient/patient-profile-form';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getCurrentPatientProfile } from '@/server/queries/patient-profile';

function formatDateForInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : '';
}

export default async function ProfilePage() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.PATIENT_UPDATE_DEMOGRAPHICS);
  const header = (
    <DashboardPageHeader
      title="Data Saya"
      description={
        role === 'USER'
          ? 'Perbarui informasi pribadi yang diperlukan untuk layanan. Email akun dikelola terpisah.'
          : 'Halaman ini hanya tersedia untuk pasien.'
      }
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Data Saya' }]}
    />
  );
  if (role !== 'USER') return <div className="mx-auto max-w-7xl space-y-6">{header}</div>;
  const profile = await getCurrentPatientProfile(session.user.id);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {header}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pasien</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientProfileForm
            email={session.user.email}
            initialValues={{
              fullName: profile?.fullName ?? session.user.name ?? '',
              preferredName: profile?.preferredName ?? '',
              phone: profile?.phone ?? '',
              dateOfBirth: formatDateForInput(profile?.dateOfBirth),
              occupation: profile?.occupation ?? '',
              addressLine: profile?.addressLine ?? '',
              emergencyContactName: profile?.emergencyContactName ?? '',
              emergencyContactRelationship: profile?.emergencyContactRelationship ?? '',
              emergencyContactPhone: profile?.emergencyContactPhone ?? '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
