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
    'patient.program.complete': 'Menyelesaikan program terapi pasien',
    'intake.submit': 'Mengirim formulir intake',
    'intake.review': 'Meninjau formulir intake',
    'intake.accept': 'Menerima formulir intake',
    'intake.reject': 'Menolak formulir intake',
    'intake.archive': 'Mengarsipkan form awal',
    'intake.request-revision': 'Meminta revisi form awal',
    'appointment.create': 'Membuat janji temu baru',
    'appointment.update': 'Memperbarui janji temu',
    'appointment.cancel': 'Membatalkan janji temu',
    'appointment.complete': 'Menyelesaikan janji temu',
    'assessment.create': 'Membuat asesmen baru',
    'assessment.update': 'Memperbarui asesmen',
    'assessment.finalize': 'Memfinalisasi asesmen',
    'progress.create': 'Mencatat evaluasi rekam medis',
    'progress.update': 'Memperbarui rekam medis',
    'progress.finalize': 'Memfinalisasi rekam medis',
    'session.create': 'Mencatat sesi terapi',
    'session.update': 'Memperbarui sesi terapi',
    'session.finalize': 'Memfinalisasi sesi terapi',
    'settings.update': 'Memperbarui pengaturan sistem',
    'role.assign': 'Menetapkan role pengguna',
    'document.upload': 'Mengunggah dokumen',
    'document.archive': 'Mengarsipkan dokumen',
  };

  if (descriptions[action]) return descriptions[action];

  // Humanize generic action names if not in dictionary
  if (action.startsWith('progress.')) return 'Pembaruan rekam medis';
  if (action.startsWith('appointment.')) return 'Pembaruan janji temu';
  if (action.startsWith('intake.')) return 'Pembaruan form awal';
  if (action.startsWith('patient.')) return 'Pembaruan data pasien';

  return 'Aktivitas terrekam';
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

  // Terapis hanya melihat aktivitas klinis (jadwal, rekam medis, intake, asesmen)
  if (role === 'THERAPIST') {
    query = query.where(
      inArray(auditLogs.action, [
        'appointment.create',
        'appointment.update',
        'appointment.cancel',
        'appointment.complete',
        'intake.submit',
        'intake.review',
        'intake.accept',
        'intake.request-revision',
        'assessment.create',
        'assessment.update',
        'assessment.finalize',
        'progress.create',
        'progress.update',
        'progress.finalize',
        'session.create',
        'session.update',
        'session.finalize',
        'patient.create',
        'patient.update',
        'patient.program.complete',
      ])
    ) as any;
  } else if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    // Non-admin lainnya tidak boleh melihat log administrasi sistem/user/role
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
