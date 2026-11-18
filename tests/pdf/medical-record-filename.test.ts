import { describe, expect, it } from 'vitest';
import { medicalRecordFileName } from '@/components/pdf/medical-record-filename';

describe('medical record PDF file name', () => {
  it('uses patient name, medical record number and date', () => {
    expect(
      medicalRecordFileName({
        id: '9b33233f-025b-4b8b-b40d-d3b765a25e27',
        patientName: 'Dimas Aditya',
        medicalRecordNumber: 'DA1826',
        recordedAt: new Date(2026, 10, 18),
      }),
    ).toBe('Dimas Aditya-DA1826-2026-11-18.pdf');
  });

  it('falls back to the record id when no medical record number exists', () => {
    expect(
      medicalRecordFileName({
        id: '9b33233f-025b-4b8b-b40d-d3b765a25e27',
        patientName: 'Pasien Uji',
        medicalRecordNumber: null,
        recordedAt: new Date(2026, 0, 5),
      }),
    ).toBe('Pasien Uji-9B33233F-2026-01-05.pdf');
  });

  it('strips characters that are illegal in file names', () => {
    expect(
      medicalRecordFileName({
        id: 'abcdef12-0000-0000-0000-000000000000',
        patientName: 'A/B:C*D?',
        medicalRecordNumber: 'RM/01',
        recordedAt: new Date(2026, 11, 31),
      }),
    ).toBe('A-B-C-D--RM-01-2026-12-31.pdf');
  });
});
