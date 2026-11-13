export type DocumentView = {
  id: string;
  patientId: string;
  patientName: string;
  medicalRecordNumber: string | null;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
  documentType: string;
  patientVisible: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  uploadedByName: string | null;
  createdAt: Date;
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  EXAM_RESULT: 'Hasil Pemeriksaan',
  REFERRAL: 'Surat Rujukan',
  INSURANCE: 'Asuransi',
  MEDICAL_RECORD: 'Rekam Medis',
  CONSENT: 'Persetujuan',
  OTHER: 'Lainnya',
};

export const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS);

export function isAllowedDocumentMime(mime: string) {
  return ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(mime);
}

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
