import type { AppSettings } from './settings';

/**
 * Maintenance gate.
 *
 * Sumber kebenaran status maintenance ada di tabel `app_settings` (diubah oleh
 * SUPER_ADMIN dari /dashboard/settings). Proxy tidak boleh melakukan query DB,
 * sehingga nilainya di-mirror ke environment variable oleh server action ketika
 * pengaturan disimpan. Env variable tetap menjadi kill switch darurat.
 *
 * Catatan penting: `decideMaintenance` TIDAK melakukan bypass apapun. Semua
 * pengecualian (path statis, halaman maintenance, API auth, session SUPER_ADMIN)
 * ditangani oleh pemanggil (proxy) supaya tidak ada jalur pintas tersembunyi.
 */
export type MaintenanceFlags = {
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  title: string;
  message: string;
};

export type MaintenanceDecision = {
  mode: 'allow' | 'maintenance';
  reason: 'disabled' | 'outside-window' | 'active';
  flags: MaintenanceFlags;
};

export const MAINTENANCE_MODE_VALUES = ['true', 'false'] as const;

export function normalizeBoolean(value: string | undefined | null, fallback = false): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['true', 'on', '1', 'yes'].includes(normalized)) return true;
  if (['false', 'off', '0', 'no'].includes(normalized)) return false;
  return fallback;
}

export function parseMaintenanceDate(value: string): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function readMaintenanceFlags(source: Partial<Record<string, string>>): MaintenanceFlags {
  return {
    enabled: normalizeBoolean(source.maintenance_mode, false),
    startsAt: source.maintenance_starts_at ?? '',
    endsAt: source.maintenance_ends_at ?? '',
    title: source.maintenance_title?.trim() || 'Hafta Fisioterapi sedang dirawat',
    message:
      source.maintenance_message?.trim() ||
      'Kami sedang melakukan pemeliharaan sistem untuk meningkatkan kualitas layanan. Silakan kembali lagi beberapa saat lagi.',
  };
}

export function flagsFromAppSettings(settings: AppSettings): MaintenanceFlags {
  return readMaintenanceFlags(settings as unknown as Partial<Record<string, string>>);
}

/** Hanya membaca env (dipakai proxy, tanpa query DB). */
export function flagsFromEnv(env: Record<string, string | undefined>): MaintenanceFlags {
  return readMaintenanceFlags({
    maintenance_mode: env.MAINTENANCE_MODE,
    maintenance_starts_at: env.MAINTENANCE_STARTS_AT,
    maintenance_ends_at: env.MAINTENANCE_ENDS_AT,
    maintenance_title: env.MAINTENANCE_TITLE,
    maintenance_message: env.MAINTENANCE_MESSAGE,
  });
}

/** True bila `now` berada di dalam jendela maintenance (atau tanpa jendela). */
export function isWithinMaintenanceWindow(flags: MaintenanceFlags, now = new Date()): boolean {
  if (!flags.enabled) return false;
  const start = parseMaintenanceDate(flags.startsAt);
  const end = parseMaintenanceDate(flags.endsAt);
  if (!start && !end) return true;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

/** Alasan maintenance untuk ditampilkan pada halaman maintenance. */
export function maintenanceReasonLabel(reason: MaintenanceDecision['reason']): string {
  if (reason === 'active') return 'Pemeliharaan terjadwal sedang berlangsung.';
  if (reason === 'outside-window') return 'Pemeliharaan akan dimulai sesuai jadwal.';
  return 'Sistem beroperasi normal.';
}

export function decideMaintenance(input: {
  flags: MaintenanceFlags;
  now?: Date;
}): MaintenanceDecision {
  const { flags, now = new Date() } = input;
  if (!flags.enabled) return { mode: 'allow', reason: 'disabled', flags };
  if (!isWithinMaintenanceWindow(flags, now)) return { mode: 'allow', reason: 'outside-window', flags };
  return { mode: 'maintenance', reason: 'active', flags };
}

/** Path yang tetap dapat diakses tanpa sesi saat maintenance aktif. */
export function isMaintenanceStaticPath(pathname: string): boolean {
  const prefixes = [
    '/maintenance',
    '/api/auth',
    '/_next',
    '/images',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.webmanifest',
  ];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Halaman yang tetap terbuka selama maintenance agar SUPER_ADMIN dapat masuk
 * dan mematikan maintenance. Semua route lain di bawah /dashboard tetap
 * ditolak oleh guard server-side di `/dashboard/layout.tsx`.
 */
export function isMaintenanceStaffEntryPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/dashboard/settings' ||
    pathname === '/dashboard/profile' ||
    pathname === '/dashboard/security'
  );
}
