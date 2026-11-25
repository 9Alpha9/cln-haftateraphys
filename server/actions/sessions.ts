'use server';

import { and, desc, eq, gt, inArray, ne } from 'drizzle-orm';
import { headers } from 'next/headers';
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
  /** Seluruh sesi aktif yang digabung dalam entri ini (per perangkat + IP). */
  sessionIds: string[];
};

/**
 * IP klien asli dari header proxy (urut prioritas). Tanpa proxy (development
 * lokal) mengembalikan null sehingga jatuh ke fallback localhost.
 */
async function detectClientIp(): Promise<string | null> {
  const requestHeaders = await headers();
  for (const key of ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip']) {
    const raw = requestHeaders.get(key);
    const first = raw?.split(',')[0]?.trim();
    if (first) return first;
  }
  if (process.env.NODE_ENV !== 'production') return '127.0.0.1';
  return null;
}

/** IP yang kosong atau semua-nol (artefak localhost yang tersimpan mentah) dianggap tidak valid. */
function isInvalidIp(value: string | null): boolean {
  if (!value) return true;
  return value.replace(/[0:]/g, '') === '';
}

/**
 * Daftar sesi aktif, DIGABUNG per perangkat (userAgent) + alamat IP — bukan
 * per waktu login — agar satu perangkat tidak membanjiri daftar dengan banyak
 * baris. Baris dengan IP kosong/tidak valid diperbaiki dulu dari IP klien yang
 * terdeteksi pada request berjalan.
 */
export async function listUserSessions(): Promise<UserSessionView[]> {
  const { session } = await requireSession({ redirectToLogin: false });
  const currentSessionId = session.session.id;
  const db = getDb();

  let rows = await db
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

  const invalidIds = rows.filter((row) => isInvalidIp(row.ipAddress)).map((row) => row.id);
  if (invalidIds.length > 0) {
    const detectedIp = await detectClientIp();
    if (detectedIp) {
      await db
        .update(sessions)
        .set({ ipAddress: detectedIp, updatedAt: new Date() })
        .where(inArray(sessions.id, invalidIds));
      rows = rows.map((row) =>
        invalidIds.includes(row.id) ? { ...row, ipAddress: detectedIp } : row,
      );
    }
  }

  // Kelompokkan per perangkat + IP; baris sudah urut terbaru → entri pertama
  // mewakili login terakhir kelompoknya.
  const groups = new Map<string, UserSessionView>();
  for (const row of rows) {
    const key = `${row.userAgent ?? ''}|${row.ipAddress ?? ''}`;
    const existing = groups.get(key);
    if (existing) {
      existing.sessionIds.push(row.id);
      continue;
    }
    groups.set(key, { ...row, isCurrent: false, sessionIds: [row.id] });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    isCurrent: group.sessionIds.includes(currentSessionId),
  }));
}

export type RevokeSessionResult = { ok: true; count: number } | { ok: false; error: string };

/** Cabut satu atau beberapa sesi (dipanggil per grup perangkat + IP). */
export async function revokeUserSession(sessionIds: string[]): Promise<RevokeSessionResult> {
  try {
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return { ok: false, error: 'Tidak ada sesi yang dipilih.' };
    }
    const { session } = await requireSession({ redirectToLogin: false });
    if (sessionIds.includes(session.session.id)) {
      return { ok: false, error: 'Sesi yang sedang digunakan tidak dapat dicabut dari halaman ini.' };
    }

    const deleted = await getDb()
      .delete(sessions)
      .where(and(inArray(sessions.id, sessionIds), eq(sessions.userId, session.user.id)))
      .returning({ id: sessions.id });

    if (deleted.length === 0) {
      return { ok: false, error: 'Sesi tidak ditemukan atau sudah tidak aktif.' };
    }

    await createAuditLog({
      action: 'user.session.revoke',
      targetType: 'session',
      targetId: sessionIds[0],
      meta: { revokedCount: deleted.length },
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
