import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { auditLogs, users } from '@/db/schema';

export type AuditLogView = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
};

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    'user.login': 'USER_LOGIN',
    'user.logout': 'USER_LOGOUT',
    'user.create': 'USER_CREATE',
    'user.update': 'USER_UPDATE',
    'user.suspend': 'USER_SUSPEND',
    'user.reactivate': 'USER_REACTIVATE',
    'patient.create': 'PATIENT_CREATE',
    'patient.update': 'PATIENT_UPDATE',
    'patient.archive': 'PATIENT_ARCHIVE',
    'intake.submit': 'INTAKE_SUBMIT',
    'intake.review': 'INTAKE_REVIEW',
    'intake.accept': 'INTAKE_ACCEPT',
    'intake.reject': 'INTAKE_REJECT',
    'appointment.create': 'APPOINTMENT_CREATE',
    'appointment.update': 'APPOINTMENT_UPDATE',
    'appointment.cancel': 'APPOINTMENT_CANCEL',
    'appointment.complete': 'APPOINTMENT_COMPLETE',
    'assessment.create': 'ASSESSMENT_CREATE',
    'assessment.update': 'ASSESSMENT_UPDATE',
    'assessment.finalize': 'ASSESSMENT_FINALIZE',
    'session.create': 'SESSION_CREATE',
    'session.update': 'SESSION_UPDATE',
    'session.finalize': 'SESSION_FINALIZE',
    'settings.update': 'SETTINGS_UPDATE',
    'role.assign': 'ROLE_ASSIGN',
    'document.upload': 'DOCUMENT_UPLOAD',
    'document.archive': 'DOCUMENT_ARCHIVE',
  };
  return actionMap[action] ?? action.toUpperCase().replace(/\./g, '_');
}

export async function getAuditLogs(page = 1, pageSize = 50) {
  const db = getDb();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;

  const [countResult, items] = await Promise.all([
    db.select({ value: sql<number>`count(*)::int` }).from(auditLogs),
    db
      .select({
        id: auditLogs.id,
        actorUserId: auditLogs.actorUserId,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        meta: auditLogs.meta,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        actorName: users.name,
        actorEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(safePageSize)
      .offset(offset),
  ]);

  const total = countResult?.[0]?.value ?? 0;
  return {
    items: items.map((item) => ({
      ...item,
      action: formatAction(item.action),
      meta: item.meta as Record<string, unknown> | null,
      createdAt: new Date(item.createdAt),
    })),
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    page: safePage,
    pageSize: safePageSize,
  };
}
