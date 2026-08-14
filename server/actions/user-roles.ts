'use server';

import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { recordAudit } from '@/server/audit';

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'STAFF', 'USER']),
});

export type AssignRoleResult = { ok: true } | { ok: false; error: string };

export async function assignRole(input: unknown): Promise<AssignRoleResult> {
  try {
    const { userId, role } = assignRoleSchema.parse(input);
    const { session, role: actorRole } = await requireSession({
      redirectToLogin: false,
    });

    if (actorRole !== 'SUPER_ADMIN' || !hasPermission(actorRole, PERMISSIONS.ROLE_ASSIGN)) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk mengubah role.' };
    }

    if (userId === session.user.id) {
      return { ok: false, error: 'Anda tidak dapat mengubah role akun sendiri.' };
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

    if (target.accountType === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      const [superAdmins] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(profiles)
        .where(eq(profiles.accountType, 'SUPER_ADMIN'));

      if ((superAdmins?.count ?? 0) <= 1) {
        return { ok: false, error: 'Tidak dapat menurunkan Super Admin terakhir.' };
      }
    }

    await db
      .insert(profiles)
      .values({ userId, accountType: role })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { accountType: role, updatedAt: new Date() },
      });

    await recordAudit('role.assign', {
      targetType: 'user',
      targetId: userId,
      meta: { actorRole, fromRole: target.accountType, toRole: role, targetEmail: target.email },
    });

    revalidatePath('/dashboard/users');
    return { ok: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: 'Data role tidak valid.' };
    }
    return { ok: false, error: 'Gagal mengubah role. Silakan coba lagi.' };
  }
}
