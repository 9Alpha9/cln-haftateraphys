'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { appSettings } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { createAuditLog } from '@/lib/audit';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { invalidateMaintenanceCache, parseMaintenanceDate } from '@/lib/maintenance';

const maintenanceSchema = z.object({
  enabled: z.enum(['true', 'false']),
  title: z.string().trim().min(4, 'Judul minimal 4 karakter.').max(120),
  message: z.string().trim().min(10, 'Pesan minimal 10 karakter.').max(600),
  until: z
    .string()
    .trim()
    .max(40)
    .refine((value) => value === '' || parseMaintenanceDate(value) !== null, {
      message: 'Format waktu selesai tidak valid.',
    }),
});

export type SaveMaintenanceResult = { ok: true } | { ok: false; error: string };

export async function saveMaintenanceSettings(input: unknown): Promise<SaveMaintenanceResult> {
  const parsed = maintenanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data maintenance tidak valid.' };
  }

  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.SETTINGS_MANAGE)) {
    return { ok: false, error: 'Hanya Super Admin yang dapat mengubah mode pemeliharaan.' };
  }

  const values: Record<string, string> = {
    maintenance_mode: parsed.data.enabled,
    maintenance_title: parsed.data.title,
    maintenance_message: parsed.data.message,
    maintenance_until: parsed.data.until ? new Date(parsed.data.until).toISOString() : '',
  };

  const db = getDb();
  for (const [key, value] of Object.entries(values)) {
    await db
      .insert(appSettings)
      .values({ key, value, updatedBy: session.user.id })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedBy: session.user.id, updatedAt: new Date() },
      });
  }

  invalidateMaintenanceCache();

  await createAuditLog({
    action: parsed.data.enabled === 'true' ? 'settings.maintenance.enable' : 'settings.maintenance.disable',
    targetType: 'settings',
    targetId: 'maintenance',
    meta: { until: values.maintenance_until || null, title: parsed.data.title },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/maintenance');
  revalidatePath('/dashboard/settings');
  revalidatePath('/maintenance');
  return { ok: true };
}
