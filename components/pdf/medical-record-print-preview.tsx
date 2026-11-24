'use client';

import type { MedicalRecordPdfData } from './medical-record-document';
import { medicalRecordFileName } from './medical-record-filename';
import { PdfCanvasViewer } from './pdf-canvas-viewer';

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
    />
  );
}
