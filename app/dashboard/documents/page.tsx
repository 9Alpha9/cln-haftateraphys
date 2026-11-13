import { Paperclip } from 'lucide-react';
import { notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DocumentsManager } from '@/components/dashboard/documents/documents-manager';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import type { Role } from '@/lib/permissions/roles';
import { isR2Configured } from '@/lib/storage/r2';
import { listDocuments } from '@/server/queries/documents';
import { getPatientSelectOptions } from '@/server/queries/patients';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const { role } = await requireSession({ redirectToLogin: true });

  const canList = hasPermission(role, PERMISSIONS.DOCUMENT_LIST);
  if (!canList) notFound();
  return <DocumentsContent role={role} />;
}

async function DocumentsContent({ role }: { role: Role }) {
  const canUpload = hasPermission(role, PERMISSIONS.DOCUMENT_UPLOAD);
  const canDownload = hasPermission(role, PERMISSIONS.DOCUMENT_DOWNLOAD);
  const canArchive = hasPermission(role, PERMISSIONS.DOCUMENT_ARCHIVE);

  const [documents, patientOptions] = await Promise.all([
    listDocuments(),
    canUpload ? getPatientSelectOptions() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <DashboardPageHeader
        title="Dokumen"
        description="Kelola dokumen pendukung pasien dengan penyimpanan privat dan akses terbatas."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Dokumen' }]}
        icon={<Paperclip className="h-6 w-6" />}
      />
      <DocumentsManager
        documents={documents}
        patientOptions={patientOptions}
        canUpload={canUpload}
        canDownload={canDownload}
        canArchive={canArchive}
        storageReady={isR2Configured()}
      />
    </div>
  );
}
