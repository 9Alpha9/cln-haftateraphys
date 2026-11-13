'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { appSettings } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { createAuditLog } from '@/lib/audit';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

const settingsSchema = z.object({
  clinic_name: z.string().trim().min(2).max(120),
  clinic_phone: z.string().trim().max(40),
  clinic_email: z.string().trim().email().or(z.literal('')),
  clinic_address: z.string().trim().max(300),
  appointment_reminders_enabled: z.enum(['true', 'false']),
});

export type SaveSettingsResult = { ok: true } | { ok: false; error: string };

export async function saveAppSettings(input: unknown): Promise<SaveSettingsResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Data pengaturan tidak valid.' };
  }

  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.SETTINGS_MANAGE)) {
    return { ok: false, error: 'Anda tidak memiliki izin mengubah pengaturan.' };
  }

  const db = getDb();
  for (const [key, value] of Object.entries(parsed.data)) {
    await db
      .insert(appSettings)
      .values({ key, value, updatedBy: session.user.id })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedBy: session.user.id, updatedAt: new Date() },
      });
  }

  await createAuditLog({
    action: 'settings.update',
    targetType: 'settings',
    targetId: 'app',
    meta: { keys: Object.keys(parsed.data) },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/settings');
  return { ok: true };
}
