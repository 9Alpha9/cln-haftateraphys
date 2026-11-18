import type { MedicalRecordPdfData } from './medical-record-document';

/**
 * Pratinjau PDF rekam medis.
 *
 * Berkas diambil dari endpoint `/dashboard/progress/[recordId]/pdf` (bukan blob
 * dari renderer klien) supaya viewer PDF browser menerima header
 * `Content-Disposition` dan tombol unduh di dalam viewer menyimpan berkas dengan
 * nama rekam medis yang benar.
 */
export function MedicalRecordPrintPreview({ record }: { record: MedicalRecordPdfData }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <iframe
        data-pdf-preview
        src={`/dashboard/progress/${record.id}/pdf`}
        title="Pratinjau rekam medis PDF"
        className="h-full min-h-[320px] w-full border-0 bg-white"
      />
    </div>
  );
}
