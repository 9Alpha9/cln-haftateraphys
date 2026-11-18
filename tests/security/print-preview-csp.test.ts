import { describe, expect, it } from 'vitest';
import { canAccessDashboardPath } from '@/lib/permissions/dashboard-routes';
import nextConfig from '@/next.config';

describe('medical record print preview', () => {
  it('keeps the print route limited to clinical roles', () => {
    const printPath = '/dashboard/progress/0f7c5d1a-print/print';
    for (const role of ['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'USER'] as const) {
      expect(canAccessDashboardPath(role, printPath), role).toBe(true);
    }
    expect(canAccessDashboardPath('STAFF', printPath)).toBe(false);
  });

  it('allows same-origin and blob iframes so the PDF preview can render', async () => {
    const headers = await nextConfig.headers?.();
    const globalHeaders = headers?.find((entry) => entry.source === '/(.*)');
    const csp = globalHeaders?.headers.find(
      (header) => header.key.toLowerCase() === 'content-security-policy',
    )?.value;

    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('default-src *');
    const frameSrc = csp?.split(';').map((part) => part.trim()).find((part) => part.startsWith('frame-src')) ?? '';
    expect(frameSrc).toContain("'self'");
    expect(frameSrc).toContain('blob:');
  });
});
