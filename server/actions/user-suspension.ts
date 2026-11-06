'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { sessions, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { createAuditLog } from '@/lib/audit';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

const setSuspensionSchema = z.object({
  userId: z.string().uuid(),
  suspend: z.boolean(),
});

export type SetUserSuspensionResult = { ok: true } | { ok: false; error: string };

/**
 * Suspend or reactivate an account (SA-001). Suspension is reversible and never
 * deletes clinical data; active sessions are revoked immediately.
 */
export async function setUserSuspension(input: unknown): Promise<SetUserSuspensionResult> {
  try {
    const { userId, suspend } = setSuspensionSchema.parse(input);
    const { session, role } = await requireSession({ redirectToLogin: false });
    const permission = suspend ? PERMISSIONS.USER_SUSPEND : PERMISSIONS.USER_REACTIVATE;

    if (!hasPermission(role, permission)) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk mengubah status akun.' };
    }
    if (userId === session.user.id) {
      return { ok: false, error: 'Anda tidak dapat mengubah status akun sendiri.' };
    }

    const db = getDb();
    const [target] = await db
      .select({ id: users.id, email: users.email, suspendedAt: users.suspendedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) {
      return { ok: false, error: 'Pengguna tidak ditemukan.' };
    }
    if (suspend && target.suspendedAt) {
      return { ok: false, error: 'Akun sudah ditangguhkan.' };
    }
    if (!suspend && !target.suspendedAt) {
      return { ok: false, error: 'Akun sudah aktif.' };
    }

    await db
      .update(users)
      .set({ suspendedAt: suspend ? new Date() : null, updatedAt: new Date() })
      .where(eq(users.id, userId));

    if (suspend) {
      await db.delete(sessions).where(eq(sessions.userId, userId));
    }

    await createAuditLog({
      action: suspend ? 'user.suspend' : 'user.reactivate',
      targetType: 'user',
      targetId: userId,
      meta: { email: target.email },
      userId: session.user.id,
    });

    revalidatePath('/dashboard/users');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Status akun tidak dapat diperbarui.',
    };
  }
}
