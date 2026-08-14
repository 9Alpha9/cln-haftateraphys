import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@/lib/permissions/constants';
import { authorize, canAccessPatient, ForbiddenError } from '@/lib/permissions/policy';

const userA = {
  user: { id: 'user-a', email: 'a@example.test', role: 'USER' as const },
};

describe('authorization policy', () => {
  it("denies a USER from reading another user's patient resource", () => {
    expect(() =>
      authorize({
        session: userA,
        permission: PERMISSIONS.PATIENT_READ,
        resource: { userId: 'user-b' },
      }),
    ).toThrow(ForbiddenError);
  });

  it('denies a USER from reading patient-invisible clinical records', () => {
    expect(() =>
      authorize({
        session: userA,
        permission: PERMISSIONS.SESSION_READ,
        resource: { userId: 'user-a', patientVisible: false },
      }),
    ).toThrow(ForbiddenError);
  });

  it('denies a USER from administration routes', () => {
    expect(() => authorize({ session: userA, permission: PERMISSIONS.USER_LIST })).toThrow(ForbiddenError);
  });

  it('uses explicit policy for staff and super admin clinical scope', () => {
    const therapist = {
      user: { id: 'therapist-a', email: 'therapist@example.test', role: 'THERAPIST' as const },
    };
    const superAdmin = {
      user: { id: 'super-admin', email: 'admin@example.test', role: 'SUPER_ADMIN' as const },
    };

    expect(canAccessPatient(therapist, 'user-b', { assigned: true })).toBe(true);
    expect(canAccessPatient(superAdmin, 'user-b', { hasExplicitClinicalScope: true })).toBe(true);
  });
});
