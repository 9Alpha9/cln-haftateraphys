import { describe, expect, it } from 'vitest';
import { canAccessDashboardPath } from '@/lib/permissions/dashboard-routes';
import { buildContentSecurityPolicy } from '@/lib/security/csp';

describe('medical record print preview', () => {
  it('keeps the print route limited to clinical roles', () => {
    const printPath = '/dashboard/progress/0f7c5d1a-print/print';
    for (const role of ['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'USER'] as const) {
      expect(canAccessDashboardPath(role, printPath), role).toBe(true);
    }
    expect(canAccessDashboardPath('STAFF', printPath)).toBe(false);
  });

  it('allows same-origin and blob iframes so the PDF preview can render', () => {
    const csp = buildContentSecurityPolicy('nonce-uji', false);

    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('default-src *');

    const frameSrc =
      csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('frame-src')) ?? '';
    expect(frameSrc).toContain("'self'");
    expect(frameSrc).toContain('blob:');

    // Pemeriksaan tambahan untuk kebijakan nonce.
    const scriptSrc =
      csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('script-src')) ?? '';
    expect(scriptSrc).toContain("'nonce-nonce-uji'");
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");

    const devCsp = buildContentSecurityPolicy('nonce-uji', true);
    expect(devCsp).toContain("'unsafe-eval'");
    expect(devCsp).not.toContain('upgrade-insecure-requests');
    expect(csp).toContain('upgrade-insecure-requests');
  });
});
