import { headers } from 'next/headers';
import { getDb } from '@/db';
import { auditLogs } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';

type AuditMeta = Record<string, unknown>;

/**
 * Records an audit entry for a sensitive operation using the current session
 * as the actor. Never throws: auditing must not break the primary action.
 */
export async function recordAudit(
  action: string,
  input?: { targetType?: string; targetId?: string; meta?: AuditMeta },
) {
  try {
    let actorUserId: string | null = null;
    let ip: string | null = null;
    try {
      const { session } = await requireSession({ redirectToLogin: false });
      actorUserId = session.user.id;
    } catch {
      actorUserId = null;
    }
    try {
      const h = await headers();
      const xff = h.get('x-forwarded-for');
      ip = xff?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
    } catch {
      ip = null;
    }

    await getDb()
      .insert(auditLogs)
      .values({
        actorUserId,
        action,
        targetType: input?.targetType ?? null,
        targetId: input?.targetId ?? null,
        meta: (input?.meta as Record<string, unknown>) ?? null,
        ipAddress: ip,
      });
  } catch {
    // Auditing is best-effort; swallow failures.
  }
}
