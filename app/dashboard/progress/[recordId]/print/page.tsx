import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { buildMedicalRecordPdfSource } from '@/server/queries/medical-record-pdf';
import { MedicalRecordPrintClient } from '@/components/pdf/medical-record-print-client';

export const dynamic = 'force-dynamic';

export default async function PrintMedicalRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  const { role } = await requireSession({ redirectToLogin: true });
  if (role !== 'USER' && !hasPermission(role, PERMISSIONS.PATIENT_EXPORT)) notFound();

  const source = await buildMedicalRecordPdfSource(recordId).catch(() => null);
  if (!source) notFound();

  return <MedicalRecordPrintClient record={source.pdfRecord} />;
}
