import { describe, expect, it } from 'vitest';
import { shouldHideDashboardOnHost } from '@/lib/security/host-routing';

describe('public host dashboard isolation', () => {
  it('hides dashboard routes on the public host', () => {
    expect(shouldHideDashboardOnHost('www.hafta.test', '/dashboard', 'hafta.test')).toBe(true);
    expect(shouldHideDashboardOnHost('hafta.test', '/dashboard/patients', 'hafta.test')).toBe(true);
  });

  it('allows public landing routes and localhost development', () => {
    expect(shouldHideDashboardOnHost('www.hafta.test', '/layanan', 'hafta.test')).toBe(false);
    expect(shouldHideDashboardOnHost('localhost:3000', '/dashboard', 'hafta.test')).toBe(false);
  });
});
