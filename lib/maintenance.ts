import { appSettings } from '@/db/schema';
import { getDb } from '@/db';
import { withDefaults, type AppSettings } from './settings';

/**
 * Maintenance mode.
 *
 * Sumber kebenaran: tabel `app_settings` (dapat diubah SUPER_ADMIN). Proxy dan
 * layout membaca nilai yang sama, dengan cache singkat 5 detik agar tidak
 * menambah satu query database pada setiap request aset.
 *
 * `MAINTENANCE_MODE=force` tetap berfungsi sebagai kill switch darurat saat
 * database bermasalah.
 */
export const MAINTENANCE_DEFAULT_TITLE = 'Hafta Fisioterapi sedang dalam pemeliharaan';
export const MAINTENANCE_DEFAULT_MESSAGE =
  'Kami sedang melakukan pemeliharaan sistem agar layanan tetap aman dan stabil. Silakan kembali beberapa saat lagi. Terima kasih atas pengertian Anda.';

export type MaintenanceFlags = {
  enabled: boolean;
  title: string;
  message: string;
  until: string;
};

export type MaintenanceDecision = {
  mode: 'allow' | 'maintenance';
  reason: 'disabled' | 'outside-window' | 'active';
};

export function normalizeBoolean(value: string | undefined | null, fallback = false): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['true', 'on', '1', 'yes', 'force'].includes(normalized)) return true;
  if (['false', 'off', '0', 'no'].includes(normalized)) return false;
  return fallback;
}

export function parseMaintenanceDate(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function readMaintenanceFlags(source: Partial<Record<string, string>>): MaintenanceFlags {
  return {
    enabled: normalizeBoolean(source.maintenance_mode, false),
    title: source.maintenance_title?.trim() || MAINTENANCE_DEFAULT_TITLE,
    message: source.maintenance_message?.trim() || MAINTENANCE_DEFAULT_MESSAGE,
    until: source.maintenance_until?.trim() || '',
  };
}

export function flagsFromAppSettings(settings: AppSettings): MaintenanceFlags {
  return readMaintenanceFlags(settings as unknown as Partial<Record<string, string>>);
}

/** `now <= until` (bila `until` kosong, maintenance tidak berakhir otomatis). */
export function isWithinMaintenanceWindow(flags: MaintenanceFlags, now = new Date()): boolean {
  if (!flags.enabled) return false;
  const until = parseMaintenanceDate(flags.until);
  if (!until) return true;
  return now.getTime() <= until.getTime();
}

export function decideMaintenance(input: {
  flags: MaintenanceFlags;
  now?: Date;
}): MaintenanceDecision {
  const { flags, now = new Date() } = input;
  if (!flags.enabled) return { mode: 'allow', reason: 'disabled' };
  if (!isWithinMaintenanceWindow(flags, now)) return { mode: 'allow', reason: 'outside-window' };
  return { mode: 'maintenance', reason: 'active' };
}

/** Path yang tetap boleh diakses walau maintenance aktif. */
export function isMaintenanceExemptPath(pathname: string): boolean {
  if (pathname === '/maintenance') return true;
  if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') return true;
  // Halaman verifikasi email tetap dibuka agar tautan lama tidak menjadi jalan buntu.
  if (pathname === '/verify-email') return true;
  if (pathname === '/api' || pathname.startsWith('/api/')) return true;
  if (pathname === '/_next' || pathname.startsWith('/_next/')) return true;
  if (pathname === '/images' || pathname.startsWith('/images/')) return true;
  if (pathname === '/favicon.ico' || pathname === '/robots.txt' || pathname === '/sitemap.xml') return true;
  // Dashboard dibuka di proxy, tetapi layout server menolak semua role selain
  // SUPER_ADMIN selama maintenance. Ini menghindari kebutuhan membaca session
  // Better Auth di dalam proxy.
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true;
  return false;
}

type Cached = { at: number; flags: MaintenanceFlags };

let cache: Cached | null = null;

export function invalidateMaintenanceCache() {
  cache = null;
}

async function loadFlags(): Promise<MaintenanceFlags> {
  if (process.env.MAINTENANCE_MODE === 'force') {
    return readMaintenanceFlags({
      maintenance_mode: 'true',
      maintenance_title: process.env.MAINTENANCE_TITLE,
      maintenance_message: process.env.MAINTENANCE_MESSAGE,
      maintenance_until: process.env.MAINTENANCE_UNTIL,
    });
  }

  try {
    const rows = await getDb().select({ key: appSettings.key, value: appSettings.value }).from(appSettings);
    const values: Record<string, string> = {};
    for (const row of rows) values[row.key] = row.value;
    return readMaintenanceFlags(withDefaults(values) as unknown as Partial<Record<string, string>>);
  } catch {
    // Kegagalan database tidak boleh mengunci seluruh situs.
    return readMaintenanceFlags({});
  }
}

export async function getMaintenanceFlags(options?: { fresh?: boolean }): Promise<MaintenanceFlags> {
  if (!options?.fresh && cache && Date.now() - cache.at < 5000) return cache.flags;
  const flags = await loadFlags();
  cache = { at: Date.now(), flags };
  return flags;
}

export function maintenanceReasonLabel(reason: MaintenanceDecision['reason']): string {
  if (reason === 'active') return 'Pemeliharaan sedang berlangsung.';
  if (reason === 'outside-window') return 'Jadwal pemeliharaan telah berakhir.';
  return 'Sistem beroperasi normal.';
}
