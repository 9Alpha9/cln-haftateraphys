'use client';

import { pdf } from '@react-pdf/renderer';
import { MedicalRecordDocument, type MedicalRecordPdfData } from './medical-record-document';

/**
 * Hitung halaman dengan membaca penanda objek halaman pada byte PDF. Cukup untuk
 * memilih layout tanda tangan; bukan parser PDF penuh. Bila gagal dihitung,
 * anggap satu halaman agar footer tetap berada di halaman yang sama.
 */
async function countPdfPages(blob: Blob): Promise<number> {
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder('latin1').decode(bytes);
    const matches = text.match(/\/Type\s*\/Page(?![s])/g);
    return matches?.length ?? 1;
  } catch {
    return 1;
  }
}

/**
 * Satu pintu untuk semua ekspor rekam medis (cetak & unduh). Bila isi melebihi
 * satu halaman, dokumen dirender ulang dengan lembar pengesahan terpisah agar
 * footer tidak menumpuk isi dan tidak menghasilkan halaman kosong.
 */
export async function renderMedicalRecordPdf(record: MedicalRecordPdfData): Promise<Blob> {
  const firstPass = await pdf(
    <MedicalRecordDocument record={record} signatureOnNewPage={false} />,
  ).toBlob();

  const pageCount = await countPdfPages(firstPass);
  if (pageCount <= 1) return firstPass;

  return pdf(
    <MedicalRecordDocument record={record} signatureOnNewPage />,
  ).toBlob();
}

export function medicalRecordFileName(record: MedicalRecordPdfData): string {
  const safe = (value: string) => value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
  const date = new Date(record.recordedAt);
  const datePart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const rmPart = safe(record.medicalRecordNumber || record.id.slice(0, 8).toUpperCase());
  return `${safe(record.patientName)}-${rmPart}-${datePart}.pdf`;
}
