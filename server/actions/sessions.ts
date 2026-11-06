'use server';

import { and, desc, eq, gt, ne } from 'drizzle-orm';
import { getDb } from '@/db';
import { sessions } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { createAuditLog } from '@/lib/audit';

export type UserSessionView = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
};

export async function listUserSessions(): Promise<UserSessionView[]> {
  const { session } = await requireSession({ redirectToLogin: false });
  const currentSessionId = session.session.id;
  const db = getDb();

  const rows = await db
    .select({
      id: sessions.id,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
      ipAddress: sessions.ipAddress,
      userAgent: sessions.userAgent,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, session.user.id), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.createdAt));

  return rows.map((row) => ({ ...row, isCurrent: row.id === currentSessionId }));
}

export type RevokeSessionResult = { ok: true; count: number } | { ok: false; error: string };

export async function revokeUserSession(sessionId: string): Promise<RevokeSessionResult> {
  try {
    const { session } = await requireSession({ redirectToLogin: false });
    if (sessionId === session.session.id) {
      return { ok: false, error: 'Sesi yang sedang digunakan tidak dapat dicabut dari halaman ini.' };
    }

    const deleted = await getDb()
      .delete(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, session.user.id)))
      .returning({ id: sessions.id });

    if (deleted.length === 0) {
      return { ok: false, error: 'Sesi tidak ditemukan atau sudah tidak aktif.' };
    }

    await createAuditLog({
      action: 'user.session.revoke',
      targetType: 'session',
      targetId: sessionId,
      userId: session.user.id,
    });

    return { ok: true, count: deleted.length };
  } catch {
    return { ok: false, error: 'Sesi tidak dapat dicabut. Coba lagi.' };
  }
}

export async function revokeOtherUserSessions(): Promise<RevokeSessionResult> {
  try {
    const { session } = await requireSession({ redirectToLogin: false });
    const deleted = await getDb()
      .delete(sessions)
      .where(
        and(eq(sessions.userId, session.user.id), ne(sessions.id, session.session.id)),
      )
      .returning({ id: sessions.id });

    await createAuditLog({
      action: 'user.session.revoke_others',
      targetType: 'user',
      targetId: session.user.id,
      meta: { revokedCount: deleted.length },
      userId: session.user.id,
    });

    return { ok: true, count: deleted.length };
  } catch {
    return { ok: false, error: 'Sesi lain tidak dapat dicabut. Coba lagi.' };
  }
}
