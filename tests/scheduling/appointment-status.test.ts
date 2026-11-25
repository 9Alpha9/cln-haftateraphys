import { describe, expect, it } from 'vitest';
import {
  NO_SHOW_GRACE_MS,
  appointmentStartAt,
  isAppointmentStartPassed,
  isNoShowDue,
} from '@/server/appointment-status';

// Waktu acuan: 25 November 2026 pukul 15.00 (waktu lokal).
const now = new Date(2026, 10, 25, 15, 0, 0);

describe('appointment status rules', () => {
  it('menghitung jam mulai dari tanggal + jam (HH:MM maupun HH:MM:SS)', () => {
    expect(appointmentStartAt('2026-11-25', '14:30').getTime()).toBe(
      new Date(2026, 10, 25, 14, 30).getTime(),
    );
    expect(appointmentStartAt('2026-11-25', '14:30:00').getTime()).toBe(
      new Date(2026, 10, 25, 14, 30).getTime(),
    );
    expect(NO_SHOW_GRACE_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('mengunci jadwal setelah jam mulai terlewati', () => {
    expect(isAppointmentStartPassed('2026-11-25', '14:30', now)).toBe(true);
    expect(isAppointmentStartPassed('2026-11-25', '15:00', now)).toBe(true); // batas tepat
    expect(isAppointmentStartPassed('2026-11-25', '16:00', now)).toBe(false);
    expect(isAppointmentStartPassed('2026-11-26', '09:00', now)).toBe(false);
  });

  it('menandai NO_SHOW hanya setelah lewat jam mulai + 24 jam', () => {
    // Mulai 24 Nov 14.30 → jatuh tempo NO_SHOW 25 Nov 14.30 (sudah lewat 15.00).
    expect(isNoShowDue('2026-11-24', '14:30', now)).toBe(true);
    // Mulai 24 Nov 16.00 → jatuh tempo 25 Nov 16.00 (masih kurang 1 jam).
    expect(isNoShowDue('2026-11-24', '16:00', now)).toBe(false);
    // Sesi hari ini yang baru lewat jam mulai: masih dalam grace 24 jam.
    expect(isNoShowDue('2026-11-25', '09:00', now)).toBe(false);
    expect(isNoShowDue('2026-11-26', '09:00', now)).toBe(false);
  });

  it('mengabaikan data tanggal/jam yang tidak valid tanpa melempar error', () => {
    expect(isAppointmentStartPassed('invalid', 'xx:yy', now)).toBe(false);
    expect(isNoShowDue('invalid', 'xx:yy', now)).toBe(false);
  });
});
