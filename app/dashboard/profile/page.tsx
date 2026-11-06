import { PatientProfileTabs } from '@/components/patient/patient-profile-tabs';
import { StaffProfileForm } from '@/components/dashboard/staff-profile-form';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getCurrentPatientProfile } from '@/server/queries/patient-profile';
import { getCurrentStaffProfile } from '@/server/queries/staff-profile';
import { UserRound } from 'lucide-react';

function formatDateForInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : '';
}

export default async function ProfilePage() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  const header = (
    <DashboardPageHeader
      title="Data Saya"
      description={
        role === 'USER'
          ? 'Kelola identitas, alamat, kontak darurat, dan keamanan akun.'
          : 'Perbarui foto profil, nama, kontak, dan keamanan akun Anda.'
      }
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Data Saya' }]}
      icon={<UserRound />}
    />
  );

  if (role === 'USER') {
    await requirePermission(PERMISSIONS.PATIENT_UPDATE_DEMOGRAPHICS);
    const profile = await getCurrentPatientProfile(session.user.id);
    return (
      <div className="space-y-4 sm:space-y-5">
        {header}
        <PatientProfileTabs
          email={session.user.email}
          userName={session.user.name ?? ''}
          emailVerified={Boolean(session.user.emailVerified)}
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

  const profile = await getCurrentStaffProfile();
  return (
    <div className="space-y-4 sm:space-y-5">
      {header}
      <StaffProfileForm initial={profile} />
    </div>
  );
}
