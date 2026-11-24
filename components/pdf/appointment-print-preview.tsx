'use client';

import { HaftaPdfjsViewer } from './hafta-pdfjs-viewer';

/**
 * Pratinjau PDF jadwal kunjungan.
 *
 * Dokumen dibuat oleh generator yang sama (`@react-pdf/renderer`) dan disajikan
 * oleh endpoint `/dashboard/appointments/[appointmentId]/pdf`. Penampilnya adalah
 * **PDF.js Generic Viewer** resmi yang disajikan dari `/pdfjs/web/viewer.html`,
 * sehingga navigasi halaman, zoom, pencarian, sidebar, cetak, dan unduh memakai
 * kontrol bawaan PDF.js — bukan toolbar buatan aplikasi.
 */
export function AppointmentPrintPreview({ appointmentId }: { appointmentId: string }) {
  return (
    <HaftaPdfjsViewer
      src={`/dashboard/appointments/${appointmentId}/pdf`}
      title={`Jadwal Kunjungan ${appointmentId}`}
    />
  );
}
