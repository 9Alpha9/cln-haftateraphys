import { PatientProfileTabs } from '@/components/patient/patient-profile-tabs';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
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
          ? 'Kelola identitas, alamat, kontak darurat, dan keamanan akun.'
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
      <PatientProfileTabs
        email={session.user.email}
        userName={session.user.name ?? ''}
        initialAvatarUrl={profile?.avatarKey ?? null}
        initialValues={{
          fullName: profile?.fullName ?? session.user.name ?? '',
          preferredName: profile?.preferredName ?? '',
          phone: profile?.phone ?? '',
          gender: (profile?.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined) ?? 'MALE',
          medicalRecordNumber: profile?.medicalRecordNumber ?? '',
          dateOfBirth: formatDateForInput(profile?.dateOfBirth),
          occupation: profile?.occupation ?? '',
          addressLine: profile?.addressLine ?? '',
          addressProvince: profile?.addressProvince ?? '',
          addressCity: profile?.addressCity ?? '',
          emergencyContactName: profile?.emergencyContactName ?? '',
          emergencyContactRelationship: profile?.emergencyContactRelationship ?? '',
          emergencyContactPhone: profile?.emergencyContactPhone ?? '',
          avatarKey: profile?.avatarKey ?? '',
        }}
      />
    </div>
  );
}
