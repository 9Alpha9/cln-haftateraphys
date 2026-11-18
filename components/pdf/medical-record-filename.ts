/**
 * Nama berkas PDF rekam medis: `<Nama Pasien>-<No. RM>-<Tanggal>.pdf`.
 *
 * Dipakai bersama oleh renderer di browser dan endpoint PDF di server supaya
 * nama unduhan selalu sama dan tidak memakai UUID blob.
 */
export function medicalRecordFileName(record: {
  patientName: string;
  medicalRecordNumber?: string | null;
  recordedAt: Date | string;
  id: string;
}): string {
  const safe = (value: string) => value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
  const date = new Date(record.recordedAt);
  const datePart = Number.isNaN(date.getTime())
    ? ''
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const rmPart = safe(record.medicalRecordNumber || record.id.slice(0, 8).toUpperCase());
  const namePart = safe(record.patientName) || 'Rekam Medis';
  return [namePart, rmPart, datePart].filter(Boolean).join('-') + '.pdf';
}
