import { describe, expect, it } from 'vitest';
import { canAccessDashboardPath } from '@/lib/permissions/dashboard-routes';

describe('dashboard route access policy', () => {
  it('keeps patient-only routes restricted to USER', () => {
    expect(canAccessDashboardPath('USER', '/dashboard/profile')).toBe(true);
    expect(canAccessDashboardPath('ADMIN', '/dashboard/profile')).toBe(false);
    expect(canAccessDashboardPath('SUPER_ADMIN', '/dashboard/profile')).toBe(false);
  });

  it('blocks staff routes for patients', () => {
    for (const path of [
      '/dashboard/patients',
      '/dashboard/patients/123',
      '/dashboard/calendar',
      '/dashboard/users',
      '/dashboard/audit-logs',
      '/dashboard/settings',
    ]) {
      expect(canAccessDashboardPath('USER', path), path).toBe(false);
    }
  });

  it('applies the most specific rule first', () => {
    expect(canAccessDashboardPath('STAFF', '/dashboard/users')).toBe(true);
    expect(canAccessDashboardPath('STAFF', '/dashboard/users/add')).toBe(false);
    expect(canAccessDashboardPath('THERAPIST', '/dashboard/users/add')).toBe(true);
    expect(canAccessDashboardPath('USER', '/dashboard/appointments')).toBe(true);
    expect(canAccessDashboardPath('USER', '/dashboard/appointments/new')).toBe(false);
  });

  it('limits administration and audit routes', () => {
    expect(canAccessDashboardPath('ADMIN', '/dashboard/audit-logs')).toBe(true);
    expect(canAccessDashboardPath('THERAPIST', '/dashboard/audit-logs')).toBe(false);
    expect(canAccessDashboardPath('ADMIN', '/dashboard/settings')).toBe(false);
    expect(canAccessDashboardPath('SUPER_ADMIN', '/dashboard/settings')).toBe(true);
    expect(canAccessDashboardPath('ADMIN', '/dashboard/calendar-events/new')).toBe(true);
    expect(canAccessDashboardPath('THERAPIST', '/dashboard/calendar-events/new')).toBe(false);
  });

  it('allows shared routes and rejects unknown paths', () => {
    for (const role of ['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'STAFF', 'USER'] as const) {
      expect(canAccessDashboardPath(role, '/dashboard')).toBe(true);
      expect(canAccessDashboardPath(role, '/dashboard/notifications')).toBe(true);
      expect(canAccessDashboardPath(role, '/dashboard/security')).toBe(true);
      expect(canAccessDashboardPath(role, '/dashboard/unknown')).toBe(false);
    }
  });
});
