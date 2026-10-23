import { describe, expect, it } from 'vitest';
import { completeProgramSchema, completeSessionSchema } from '@/lib/validators/therapy-completion';

const uuid = '00000000-0000-4000-8000-000000000001';

describe('therapy completion validation', () => {
  it('accepts a valid session completion payload', () => {
    expect(completeSessionSchema.safeParse({ appointmentId: uuid }).success).toBe(true);
  });

  it('rejects an invalid appointment id', () => {
    expect(completeSessionSchema.safeParse({ appointmentId: 'not-a-uuid' }).success).toBe(false);
  });

  it('requires a meaningful program closure summary', () => {
    expect(completeProgramSchema.safeParse({ patientId: uuid, summary: 'Selesai' }).success).toBe(false);
    expect(
      completeProgramSchema.safeParse({
        patientId: uuid,
        summary: 'Target mobilitas tercapai dan pasien mandiri menjalankan latihan rumah.',
      }).success,
    ).toBe(true);
  });
});
