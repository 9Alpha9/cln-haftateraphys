'use client';

import type { MedicalRecordPdfData } from './medical-record-document';
import { medicalRecordFileName } from './medical-record-filename';
import { HaftaPdfjsViewer } from './hafta-pdfjs-viewer';

/**
 * Pratinjau PDF rekam medis.
 *
 * Dokumen dibuat oleh generator yang sama (`@react-pdf/renderer`) dan disajikan
 * oleh endpoint `/dashboard/progress/[recordId]/pdf`. Penampilnya adalah
 * **PDF.js Generic Viewer** resmi yang disajikan dari `/pdfjs/web/viewer.html`,
 * sehingga navigasi halaman, zoom, pencarian, sidebar, cetak, dan unduh memakai
 * kontrol bawaan PDF.js — bukan toolbar buatan aplikasi.
 */
export function MedicalRecordPrintPreview({ record }: { record: MedicalRecordPdfData }) {
  return (
    <HaftaPdfjsViewer
      src={`/dashboard/progress/${record.id}/pdf`}
      fileName={medicalRecordFileName(record)}
      title={`Rekam medis ${record.patientName}`}
    />
  );
}
