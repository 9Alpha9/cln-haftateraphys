'use server';

import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { recordAudit } from '@/server/audit';

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export type DeleteUserResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Permanently deletes a user account. All related data (patients, appointments,
 * intakes, home programs, assignments, notifications, etc.) is automatically
 * removed via ON DELETE CASCADE constraints. Guarded to SUPER_ADMIN only,
 * never self, never the last super admin.
 */
export async function deleteUser(input: unknown): Promise<DeleteUserResult> {
  try {
    const { userId } = deleteUserSchema.parse(input);
    const { session, role: actorRole } = await requireSession({
      redirectToLogin: false,
    });

    if (actorRole !== 'SUPER_ADMIN' || !hasPermission(actorRole, PERMISSIONS.USER_SUSPEND)) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk menghapus akun.' };
    }

    if (userId === session.user.id) {
      return { ok: false, error: 'Anda tidak dapat menghapus akun sendiri.' };
    }

    const db = getDb();

    const [target] = await db
      .select({ id: users.id, email: users.email, accountType: profiles.accountType })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) {
      return { ok: false, error: 'Pengguna tidak ditemukan.' };
    }

    if (target.accountType === 'SUPER_ADMIN') {
      const [superAdmins] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(profiles)
        .where(eq(profiles.accountType, 'SUPER_ADMIN'));
      if ((superAdmins?.count ?? 0) <= 1) {
        return { ok: false, error: 'Tidak dapat menghapus Super Admin terakhir.' };
      }
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!deletedUser) {
      return { ok: false, error: 'Akun tidak berhasil dihapus dari database.' };
    }

    await recordAudit('user.delete', {
      targetType: 'user',
      targetId: userId,
      meta: { actorRole, deletedEmail: target.email, deletedAccountType: target.accountType },
    });

    revalidatePath('/dashboard/users');
    return { ok: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: 'Data tidak valid.' };
    }
    return { ok: false, error: `Gagal menghapus akun: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
