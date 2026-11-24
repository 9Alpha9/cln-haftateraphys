'use client';

import type { MedicalRecordPdfData } from './medical-record-document';
import { medicalRecordFileName } from './medical-record-filename';
import { PdfCanvasViewer } from './pdf-canvas-viewer';
// `?url` memberi URL aset statis dari salinan legacy pdf.js. Berkasnya disalin
// apa adanya (tidak ditransformasi Turbopack), lalu dimuat viewer sebagai blob
// worker agar tetap jalan di browser lama — lihat `loadPdfWorkerUrl`.
// `import.meta.glob` dipakai karena Turbopack tidak mendukung import `?url`
// langsung untuk berkas .mjs di node_modules.
const workerModules = import.meta.glob('pdfjs-dist/legacy/build/pdf.worker.min.mjs', {
  query: '?url',
  import: 'default',
  eager: true,
});
const legacyWorkerUrl = (Object.values(workerModules)[0] as string | undefined) ?? null;

/**
 * Pratinjau PDF rekam medis.
 *
 * Dokumen dirender ke canvas memakai pdf.js (bukan iframe + plugin PDF browser)
 * agar tampil konsisten di desktop, iOS, dan Android — termasuk browser yang
 * tidak punya viewer PDF bawaan. Berkas tetap diambil dari endpoint
 * `/dashboard/progress/[recordId]/pdf` sehingga nama unduhan mengikuti header
 * `Content-Disposition`.
 */
export function MedicalRecordPrintPreview({ record }: { record: MedicalRecordPdfData }) {
  return (
    <PdfCanvasViewer
      src={`/dashboard/progress/${record.id}/pdf`}
      fileName={medicalRecordFileName(record)}
      workerSrc={legacyWorkerUrl}
    />
  );
}
