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

describe('therapy completion permissions', () => {
  it('grants program completion only to clinical roles', async () => {
    const { ROLE_PERMISSIONS } = await import('@/lib/permissions/roles');
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.PATIENT_COMPLETE_PROGRAM);
    expect(ROLE_PERMISSIONS.THERAPIST).toContain(PERMISSIONS.PATIENT_COMPLETE_PROGRAM);
    expect(ROLE_PERMISSIONS.STAFF).not.toContain(PERMISSIONS.PATIENT_COMPLETE_PROGRAM);
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).not.toContain(PERMISSIONS.PATIENT_COMPLETE_PROGRAM);
  });
});

describe('super admin permission model', () => {
  it('does not treat SUPER_ADMIN as a wildcard', async () => {
    const { hasPermission } = await import('@/lib/permissions/policy');
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.USER_SUSPEND)).toBe(true);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.PATIENT_LIST)).toBe(true);
    // Clinical access must be an explicit grant (SA-005).
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.PROGRESS_READ)).toBe(false);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.ASSESSMENT_READ)).toBe(false);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.SESSION_READ)).toBe(false);
  });
});
