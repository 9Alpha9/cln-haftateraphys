import { desc, eq, inArray, notInArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';

export type ActivityView = {
  id: string;
  actorName: string | null;
  action: string;
  targetType: string | null;
  description: string;
  createdAt: Date;
};

function getActionDescription(action: string, targetType: string | null): string {
  const descriptions: Record<string, string> = {
    'user.login': 'Login ke sistem',
    'user.logout': 'Keluar dari sistem',
    'user.create': 'Membuat akun pengguna baru',
    'user.update': 'Memperbarui data pengguna',
    'user.suspend': 'Menonaktifkan akun pengguna',
    'user.reactivate': 'Mengaktifkan kembali akun pengguna',
    'user.delete': 'Menghapus akun pengguna',
    'patient.create': 'Mendaftarkan pasien baru',
    'patient.update': 'Memperbarui data pasien',
    'patient.archive': 'Mengarsipkan data pasien',
    'intake.submit': 'Mengirim formulir intake',
    'intake.review': 'Meninjau formulir intake',
    'intake.accept': 'Menerima formulir intake',
    'intake.reject': 'Menolak formulir intake',
    'appointment.create': 'Membuat janji temu baru',
    'appointment.update': 'Memperbarui janji temu',
    'appointment.cancel': 'Membatalkan janji temu',
    'appointment.complete': 'Menyelesaikan janji temu',
    'assessment.create': 'Membuat asesmen baru',
    'assessment.update': 'Memperbarui asesmen',
    'assessment.finalize': 'Memfinalisasi asesmen',
    'session.create': 'Mencatat sesi terapi',
    'session.update': 'Memperbarui sesi terapi',
    'session.finalize': 'Memfinalisasi sesi terapi',
    'settings.update': 'Memperbarui pengaturan sistem',
    'role.assign': 'Menetapkan role pengguna',
    'document.upload': 'Mengunggah dokumen',
    'document.archive': 'Mengarsipkan dokumen',
  };
  return descriptions[action] ?? `Aktivitas: ${action}`;
}

export async function getRecentActivities(limit = 10): Promise<ActivityView[]> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  const db = getDb();

  let query = db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorUserId, users.id));

  // Filter out administrative actions for clinical/staff roles
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    query = query.where(
      notInArray(auditLogs.action, [
        'user.create',
        'user.update',
        'user.suspend',
        'user.reactivate',
        'user.delete',
        'role.assign',
        'settings.update',
      ])
    ) as any;
  }

  const items = await query.orderBy(desc(auditLogs.createdAt)).limit(limit);

  return items.map((item) => ({
    id: item.id,
    actorName: item.actorName,
    action: item.action,
    targetType: item.targetType,
    description: getActionDescription(item.action, item.targetType),
    createdAt: new Date(item.createdAt),
  }));
}
