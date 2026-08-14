import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const insertCalls: { tableName: string; values: Record<string, unknown> }[] = [];
  const updateCalls: { tableName: string; set: Record<string, unknown> }[] = [];
  const selectData: Record<string, Record<string, unknown>[]> = {
    patient_intakes: [{ id: 'intake-1', status: 'UNDER_REVIEW' }],
    patients: [{ userId: 'patient-user-id' }],
  };
  return { insertCalls, updateCalls, selectData, currentRole: 'ADMIN' };
});

vi.mock('@/db', () => ({
  getDb: vi.fn(() => {
    const tableName = (table: unknown) =>
      (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')] as string;

    const chainable = {
      select: () => chainable,
      from: (table: unknown) => ({
        where: () => ({
          limit: () => Promise.resolve(mocks.selectData[tableName(table)] ?? []),
          orderBy: () => ({
            limit: () => Promise.resolve(mocks.selectData[tableName(table)] ?? []),
          }),
        }),
        orderBy: () => ({
          limit: () => Promise.resolve(mocks.selectData[tableName(table)] ?? []),
        }),
      }),
insert: (table: unknown) => ({
        values: (values: Record<string, unknown>) => {
          mocks.insertCalls.push({ tableName: tableName(table), values });
          return Promise.resolve();
        },
      }),
      update: (table: unknown) => ({
        set: (set: Record<string, unknown>) => ({
          where: () => {
            mocks.updateCalls.push({ tableName: tableName(table), set });
            return Promise.resolve();
          },
        }),
      }),
    };
    return chainable;
  }),
}));

vi.mock('@/lib/auth/require-session', () => ({
  requireSession: vi.fn(async () => ({
    session: { user: { id: 'staff-user-id' } },
    role: mocks.currentRole,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { reviewPatientIntake } from '@/server/actions/intake-review';

describe('intake review notification', () => {
  beforeEach(() => {
    mocks.insertCalls.length = 0;
    mocks.updateCalls.length = 0;
    mocks.selectData.patient_intakes = [{ id: 'intake-1', status: 'UNDER_REVIEW' }];
  });

  it('creates a notification for the patient when the reviewer requests revision', async () => {
    mocks.currentRole = 'ADMIN';
    const message = 'Mohon tambahkan riwayat cedera yang lebih detail.';

    await reviewPatientIntake({
      patientId: '11111111-1111-4111-8111-111111111111',
      action: 'request-revision',
reviewMessage: message,
    });

    const intakeUpdate = mocks.updateCalls.find((c) => c.tableName === 'patient_intakes');
    expect(intakeUpdate?.set).toMatchObject({ status: 'NEEDS_REVISION', reviewMessage: message });

    const notification = mocks.insertCalls.find((c) => c.tableName === 'notifications');
    expect(notification).toBeDefined();
    expect(notification?.values).toMatchObject({
      userId: 'patient-user-id',
      title: 'Perbaikan Form Awal',
      message,
    });
  });

  it('creates an acceptance notification for the patient', async () => {
    mocks.currentRole = 'THERAPIST';
    await reviewPatientIntake({
      patientId: '11111111-1111-4111-8111-111111111111',
      action: 'accept',
    });

    const notification = mocks.insertCalls.find((c) => c.tableName === 'notifications');
    expect(notification).toBeDefined();
    expect(notification?.values).toMatchObject({
      userId: 'patient-user-id',
      title: 'Form Awal Diterima',
    });
  });

  it('does not create a notification when the review is merely started', async () => {
    mocks.currentRole = 'ADMIN';
    mocks.selectData.patient_intakes = [{ id: 'intake-1', status: 'SUBMITTED' }];
    await reviewPatientIntake({
      patientId: '11111111-1111-4111-8111-111111111111',
      action: 'start-review',
    });

    expect(mocks.insertCalls.find((c) => c.tableName === 'notifications')).toBeUndefined();
  });
});

