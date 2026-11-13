import { ShieldCheck } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PatientConsentPanel } from '@/components/patient/patient-consent-panel';
import { getMyConsents } from '@/server/queries/consents';

export const dynamic = 'force-dynamic';

export default async function ConsentPage() {
  const consents = await getMyConsents();

  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <DashboardPageHeader
        title="Consent & Privasi"
        description="Kelola persetujuan pemrosesan data, layanan klinis, dan publikasi media Anda."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Consent & Privasi' }]}
        icon={<ShieldCheck className="h-6 w-6" />}
      />
      <PatientConsentPanel consents={consents} />
    </div>
  );
}
