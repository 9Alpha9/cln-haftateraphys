import { describe, expect, it } from 'vitest';
import {
  decideMaintenance,
  isMaintenanceExemptPath,
  isWithinMaintenanceWindow,
  readMaintenanceFlags,
  normalizeBoolean,
} from '@/lib/maintenance';

const active = readMaintenanceFlags({
  maintenance_mode: 'true',
  maintenance_title: 'Perawatan',
  maintenance_message: 'Sedang diperbaiki.',
});

describe('maintenance mode', () => {
  it('normalizes boolean-like settings', () => {
    expect(normalizeBoolean('true')).toBe(true);
    expect(normalizeBoolean('force')).toBe(true);
    expect(normalizeBoolean('false')).toBe(false);
    expect(normalizeBoolean(undefined)).toBe(false);
  });

  it('blocks pages while active and respects the end time', () => {
    expect(decideMaintenance({ flags: active }).mode).toBe('maintenance');
    expect(
      decideMaintenance({ flags: active, now: new Date('2026-11-16T10:00:00+07:00') }).mode,
    ).toBe('maintenance');
    expect(isWithinMaintenanceWindow(active)).toBe(true);
  });

  it('ends automatically after the configured until time', () => {
    const scheduled = readMaintenanceFlags({
      maintenance_mode: 'true',
      maintenance_until: '2026-11-16T09:00:00+07:00',
    });
    expect(
      decideMaintenance({ flags: scheduled, now: new Date('2026-11-16T10:00:00+07:00') }).mode,
    ).toBe('allow');
  });

  it('keeps static assets, auth API, login, and dashboard reachable', () => {
    for (const path of [
      '/maintenance',
      '/api/auth/session',
      '/_next/static/chunk.js',
      '/images/logo.png',
      '/login',
      '/dashboard',
      '/dashboard/settings',
    ]) {
      expect(isMaintenanceExemptPath(path), path).toBe(true);
    }
    expect(isMaintenanceExemptPath('/dashboard/patients')).toBe(true);
  });

  it('rewrites public content routes', () => {
    expect(decideMaintenance({ flags: active }).mode).toBe('maintenance');
    for (const path of ['/', '/layanan', '/tentang', '/register', '/dashboard-does-not-exist']) {
      expect(isMaintenanceExemptPath(path), path).toBe(false);
    }
  });
});
