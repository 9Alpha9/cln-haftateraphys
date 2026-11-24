import type { AppointmentPdfData } from '@/components/pdf/appointment-document';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Nama unduhan PDF jadwal kunjungan.
 *
 * Format: `Jadwal Kunjungan - <Nama Pasien> - <dd-MM-yyyy>.pdf`
 * Contoh: `Jadwal Kunjungan - Budi Santoso - 01-01-2024.pdf`
 */
export function appointmentPdfFileName(appointment: AppointmentPdfData): string {
  const date = new Date(appointment.scheduledDate);
  const datePart = isNaN(date.getTime())
    ? 'tanpa-tanggal'
    : `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
  const safeName = appointment.patientName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Pasien';
  return `Jadwal Kunjungan - ${safeName} - ${datePart}.pdf`;
}