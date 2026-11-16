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
 * Satu pintu untuk semua ekspor rekam medis (cetak & unduh). Lembar pengesahan
 * terapis selalu dirender sebagai halaman terakhir tersendiri agar blok tanda
 * tangan tidak berdiri sendiri sebagai halaman kosong di tengah dokumen ketika
 * ada lampiran foto yang dimulai di halaman baru. Jumlah halaman dibaca ulang
 * hanya sebagai pengaman bila layout belum stabil.
 */
export async function renderMedicalRecordPdf(record: MedicalRecordPdfData): Promise<Blob> {
  const blob = await pdf(<MedicalRecordDocument record={record} signatureOnNewPage />).toBlob();
  const pageCount = await countPdfPages(blob);
  // Pengaman: bila isi ternyata hanya satu halaman, pengesahan digabung agar tidak
  // meninggalkan halaman kosong berisi isi utama saja.
  if (pageCount <= 2) {
    return pdf(<MedicalRecordDocument record={record} signatureOnNewPage={false} />).toBlob();
  }
  return blob;
}

export function medicalRecordFileName(record: MedicalRecordPdfData): string {
  const safe = (value: string) => value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
  const date = new Date(record.recordedAt);
  const datePart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const rmPart = safe(record.medicalRecordNumber || record.id.slice(0, 8).toUpperCase());
  return `${safe(record.patientName)}-${rmPart}-${datePart}.pdf`;
}
