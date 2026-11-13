export const CONSENT_POLICY_VERSION = '2026-11-01';

export type ConsentType =
  | 'PRIVACY_DATA_PROCESSING'
  | 'CLINICAL_SERVICE'
  | 'DOCUMENT_UPLOAD'
  | 'MEDIA_PUBLICATION'
  | 'TESTIMONIAL_PUBLICATION';

export type ConsentStatus = 'PENDING' | 'GRANTED' | 'WITHDRAWN' | 'EXPIRED' | 'SUPERSEDED';

export type ConsentDefinition = {
  type: ConsentType;
  label: string;
  description: string;
  /** Required for receiving clinical services. */
  required: boolean;
  /** Optional publication consent must never be bundled with service consent. */
  publication: boolean;
};

export const CONSENT_DEFINITIONS: readonly ConsentDefinition[] = [
  {
    type: 'PRIVACY_DATA_PROCESSING',
    label: 'Pemrosesan Data Pribadi',
    description:
      'Saya setuju data pribadi dan data kesehatan saya diproses untuk keperluan layanan fisioterapi di Hafta.',
    required: true,
    publication: false,
  },
  {
    type: 'CLINICAL_SERVICE',
    label: 'Layanan Klinis',
    description:
      'Saya setuju menerima pemeriksaan, asesmen, dan tindakan fisioterapi sesuai rencana yang dijelaskan terapis.',
    required: true,
    publication: false,
  },
  {
    type: 'DOCUMENT_UPLOAD',
    label: 'Unggah Dokumen Pendukung',
    description:
      'Saya setuju mengunggah dokumen pendukung (mis. hasil rontgen/MRI) yang relevan untuk menunjang terapi.',
    required: false,
    publication: false,
  },
  {
    type: 'MEDIA_PUBLICATION',
    label: 'Publikasi Media',
    description:
      'Saya setuju foto/video terapi saya digunakan untuk dokumentasi dan publikasi Hafta. Opsional dan dapat ditarik kapan saja.',
    required: false,
    publication: true,
  },
  {
    type: 'TESTIMONIAL_PUBLICATION',
    label: 'Publikasi Testimoni',
    description:
      'Saya setuju testimoni pemulihan saya dipublikasikan. Opsional dan terpisah dari persetujuan layanan.',
    required: false,
    publication: true,
  },
];

export const CONSENT_TYPES = CONSENT_DEFINITIONS.map((definition) => definition.type);

export function getConsentDefinition(type: string): ConsentDefinition | undefined {
  return CONSENT_DEFINITIONS.find((definition) => definition.type === type);
}

export const CONSENT_STATUS_LABEL: Record<ConsentStatus, string> = {
  PENDING: 'Belum diberikan',
  GRANTED: 'Disetujui',
  WITHDRAWN: 'Ditarik',
  EXPIRED: 'Kedaluwarsa',
  SUPERSEDED: 'Digantikan versi baru',
};
