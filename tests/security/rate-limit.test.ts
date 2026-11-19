import { describe, expect, it } from 'vitest';
import { buildAuthRateLimitKey, getAuthRateLimitPolicy } from '@/lib/security/rate-limit';

describe('kebijakan rate limit autentikasi', () => {
  it('membatasi login, daftar, dan reset kata sandi', () => {
    expect(getAuthRateLimitPolicy('/api/auth/sign-in/email')).toEqual({
      limit: 15,
      windowMs: 60_000,
    });
    expect(getAuthRateLimitPolicy('/api/auth/sign-up/email')).toEqual({
      limit: 8,
      windowMs: 60_000,
    });
    expect(getAuthRateLimitPolicy('/api/auth/request-password-reset')).toEqual({
      limit: 5,
      windowMs: 600_000,
    });
    expect(getAuthRateLimitPolicy('/api/auth/reset-password')).toEqual({
      limit: 10,
      windowMs: 600_000,
    });
    expect(getAuthRateLimitPolicy('/api/auth/send-verification-email')).toEqual({
      limit: 5,
      windowMs: 600_000,
    });
  });

  it('tidak membatasi jalur non-auth', () => {
    for (const path of [
      '/dashboard',
      '/api/documents/abc',
      '/api/auth/session',
      '/api/auth/get-session',
    ]) {
      expect(getAuthRateLimitPolicy(path), path).toBeNull();
    }
  });

  it('mengelompokkan endpoint per kelompok, bukan per sub-jalur', () => {
    const a = buildAuthRateLimitKey('1.2.3.4', '/api/auth/sign-in/email');
    const b = buildAuthRateLimitKey('1.2.3.4', '/api/auth/sign-in/username');
    expect(a).toBe(b);
    expect(a).toBe('ip:1.2.3.4:/api/auth/sign-in');
  });

  it('memisahkan penghitung antar IP', () => {
    const ipA = buildAuthRateLimitKey('1.1.1.1', '/api/auth/sign-in/email');
    const ipB = buildAuthRateLimitKey('2.2.2.2', '/api/auth/sign-in/email');
    expect(ipA).not.toBe(ipB);
  });
});
