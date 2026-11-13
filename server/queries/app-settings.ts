import { getDb } from '@/db';
import { appSettings } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { SETTING_KEYS, withDefaults, type AppSettings } from '@/lib/settings';

export async function getAppSettings(): Promise<AppSettings> {
  const { role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.SETTINGS_MANAGE)) {
    throw new Error('Forbidden');
  }

  const rows = await getDb().select({ key: appSettings.key, value: appSettings.value }).from(appSettings);
  const values: Record<string, string> = {};
  for (const row of rows) {
    if (SETTING_KEYS.includes(row.key as (typeof SETTING_KEYS)[number])) {
      values[row.key] = row.value;
    }
  }
  return withDefaults(values);
}

/** Lightweight reader for background jobs; falls back to defaults. */
export async function getAppSettingsUnsafe(): Promise<AppSettings> {
  try {
    const rows = await getDb().select({ key: appSettings.key, value: appSettings.value }).from(appSettings);
    const values: Record<string, string> = {};
    for (const row of rows) values[row.key] = row.value;
    return withDefaults(values);
  } catch {
    return withDefaults({});
  }
}
