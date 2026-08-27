'use server';

import { getDb } from '@/db';
import { auditLogs } from '@/db/schema';
import { getIpAddress } from '@/lib/ip';

type AuditLogInput = {
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  userId?: string;
};

export async function createAuditLog(input: AuditLogInput) {
  try {
    const db = getDb();
    const ipAddress = await getIpAddress();

    await db.insert(auditLogs).values({
      actorUserId: input.userId ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      meta: input.meta ?? null,
      ipAddress,
    });
  } catch {
    // Silent fail - audit logging should never break the main flow
  }
}
