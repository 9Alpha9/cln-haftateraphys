import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

const MINUTE = 60_000;

export type RateLimitPolicy = { limit: number; windowMs: number };

/**
 * Kebijakan rate limit untuk endpoint autentikasi.
 *
 * Semua jalur di bawah ini adalah yang bisa dipakai untuk brute force atau
 * penyalahgunaan email, jadi dibatasi per IP.
 */
export function getAuthRateLimitPolicy(pathname: string): RateLimitPolicy | null {
  if (pathname.startsWith('/api/auth/sign-in')) return { limit: 15, windowMs: MINUTE };
  if (pathname.startsWith('/api/auth/sign-up')) return { limit: 8, windowMs: MINUTE };
  if (pathname.startsWith('/api/auth/request-password-reset'))
    return { limit: 5, windowMs: 10 * MINUTE };
  if (pathname.startsWith('/api/auth/reset-password')) return { limit: 10, windowMs: 10 * MINUTE };
  if (pathname.startsWith('/api/auth/send-verification-email'))
    return { limit: 5, windowMs: 10 * MINUTE };
  return null;
}

/** Kunci penghitung: per IP dan per kelompok endpoint (bukan per email). */
export function buildAuthRateLimitKey(ip: string, pathname: string): string {
  const scope = pathname.split('/').slice(0, 4).join('/');
  return `ip:${ip}:${scope}`;
}

export type RateLimitResult = {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
};

type RateLimitRow = { count: number; reset_at: Date | string };

/**
 * Menambah hitungan satu kali dan mengembalikan status izin.
 *
 * Satu statement atomik (INSERT ... ON CONFLICT) sehingga aman untuk beberapa
 * instance sekaligus. Jendela direset otomatis ketika `reset_at` sudah lewat.
 */
export async function consumeRateLimit(
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const db = getDb();
  const windowSeconds = Math.max(1, Math.ceil(policy.windowMs / 1000));

  const result = await db.execute(sql`
    INSERT INTO rate_limit_hits (key, count, reset_at, updated_at)
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}), now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_hits.reset_at <= now() THEN 1
        ELSE rate_limit_hits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limit_hits.reset_at <= now() THEN now() + make_interval(secs => ${windowSeconds})
        ELSE rate_limit_hits.reset_at
      END,
      updated_at = now()
    RETURNING count, reset_at
  `);

  // Driver Neon mengembalikan `{ rows }`; driver pg mengembalikan array.
  const raw = result as unknown as { rows?: RateLimitRow[] } | RateLimitRow[];
  const rows = Array.isArray(raw) ? raw : (raw.rows ?? []);
  const row = rows[0];

  if (!row) {
    // Tidak ada baris kembali: jangan memblokir pengguna karena masalah internal.
    return { allowed: true, count: 0, limit: policy.limit, retryAfterSeconds: 0 };
  }

  const resetAt = row.reset_at instanceof Date ? row.reset_at : new Date(row.reset_at);
  const retryAfterSeconds = Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000));

  return {
    allowed: row.count <= policy.limit,
    count: row.count,
    limit: policy.limit,
    retryAfterSeconds,
  };
}

/** Hapus baris kedaluwarsa agar tabel tidak tumbuh tanpa batas. */
export async function pruneRateLimitHits(): Promise<void> {
  const db = getDb();
  await db.execute(sql`DELETE FROM rate_limit_hits WHERE reset_at < now() - interval '1 day'`);
}
