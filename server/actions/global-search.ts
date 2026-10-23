'use server';

import { and, ilike, or, eq, desc } from 'drizzle-orm';
import { getDb } from '@/db';
import { patients, appointments, users, profiles, auditLogs, therapyProgressRecords } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export type SearchResultItem = {
  id: string;
  category: 'Pasien' | 'Jadwal' | 'Pengguna' | 'Audit' | 'Menu' | 'Rekam Medis';
  title: string;
  subtitle: string;
  href: string;
};

export async function searchGlobalEntities(query: string): Promise<SearchResultItem[]> {
  const rawQ = query.trim();
  if (!rawQ) return [];

  const { session, role } = await requireSession({ redirectToLogin: false });
  const db = getDb();
  const results: SearchResultItem[] = [];

  // 1. Menu Cepat (Navigation Shortcuts)
  const menuShortcuts: { label: string; href: string; keywords: string[]; permission?: string }[] = [
    { label: 'Ringkasan Dashboard', href: '/dashboard', keywords: ['dashboard', 'beranda', 'home', 'ringkasan'] },
    { label: 'Jadwal Terapi', href: '/dashboard/appointments', keywords: ['jadwal', 'appointment', 'janji', 'kalender', 'sesi'], permission: PERMISSIONS.APPOINTMENT_LIST },
    { label: 'Form Awal & Intake', href: '/dashboard/intake', keywords: ['intake', 'form awal', 'keluhan', 'asesmen'], permission: PERMISSIONS.INTAKE_READ },
    { label: 'Rekam Medis & Progress', href: '/dashboard/progress', keywords: ['rekam medis', 'progress', 'medis', 'evaluasi', 'soap'], permission: PERMISSIONS.PROGRESS_READ },
    { label: 'Data Pasien', href: '/dashboard/patients', keywords: ['pasien', 'patient', 'anggota', 'member', 'daftar'], permission: PERMISSIONS.PATIENT_READ },
    { label: 'Manajemen Pengguna', href: '/dashboard/users', keywords: ['pengguna', 'user', 'staf', 'terapis', 'admin', 'akun'], permission: PERMISSIONS.USER_READ },
    { label: 'Log Audit Keamanan', href: '/dashboard/audit-logs', keywords: ['audit', 'log', 'keamanan', 'security', 'riwayat', 'jejak'], permission: PERMISSIONS.AUDIT_READ },
    { label: 'Pengaturan Sistem', href: '/dashboard/settings', keywords: ['pengaturan', 'settings', 'konfigurasi', 'sistem'], permission: PERMISSIONS.SETTINGS_MANAGE },
    { label: 'Data Saya', href: '/dashboard/profile', keywords: ['profil', 'profile', 'biodata', 'akun', 'data saya'] },
    { label: 'Keamanan Akun', href: '/dashboard/security', keywords: ['keamanan', 'password', 'kata sandi', 'security', 'login'] },
  ];

  const patientAccountMenus = new Set(['/dashboard/profile', '/dashboard/security', '/dashboard/settings']);

  for (const m of menuShortcuts) {
    if (role === 'USER' && !patientAccountMenus.has(m.href)) continue;
    if (m.permission && !hasPermission(role, m.permission as any)) continue;
    if (m.keywords.some((kw) => kw.toLowerCase().includes(rawQ.toLowerCase()) || rawQ.toLowerCase().includes(kw.toLowerCase()))) {
      results.push({
        id: `menu-${m.href}`,
        category: 'Menu',
        title: m.label,
        subtitle: `Buka halaman ${m.label}`,
        href: m.href,
      });
    }
  }

  // 2. Data Pasien
  if (hasPermission(role, PERMISSIONS.PATIENT_READ)) {
    try {
      const foundPatients = await db
        .select({
          id: patients.id,
          fullName: patients.fullName,
          mrn: patients.medicalRecordNumber,
          phone: patients.emergencyContactPhone,
        })
        .from(patients)
        .where(
          or(
            ilike(patients.fullName, `%${rawQ}%`),
            ilike(patients.medicalRecordNumber, `%${rawQ}%`)
          )
        )
        .limit(5);

      for (const p of foundPatients) {
        results.push({
          id: `patient-${p.id}`,
          category: 'Pasien',
          title: p.fullName,
          subtitle: p.mrn ? `No. RM: ${p.mrn}` : (p.phone ? `Kontak: ${p.phone}` : `Pasien Terdaftar`),
          href: `/dashboard/patients/${p.id}`,
        });
      }
    } catch {
      // ignore
    }
  }

  // 3. Data Jadwal / Appointments
  if (hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) {
    try {
      if (role === 'USER') {
        const [pt] = await db.select({ id: patients.id }).from(patients).where(eq(patients.userId, session.user.id)).limit(1);
        if (pt) {
          const foundAppts = await db
            .select({
              id: appointments.id,
              date: appointments.scheduledDate,
              time: appointments.startTime,
              type: appointments.type,
              status: appointments.status,
            })
            .from(appointments)
            .where(eq(appointments.patientId, pt.id))
            .orderBy(desc(appointments.scheduledDate))
            .limit(4);

          for (const a of foundAppts) {
            results.push({
              id: `appt-${a.id}`,
              category: 'Jadwal',
              title: `Sesi ${a.type} (${a.time})`,
              subtitle: `${new Date(a.date).toLocaleDateString('id-ID')} • Status: ${a.status}`,
              href: `/dashboard/appointments`,
            });
          }
        }
      } else {
        // Admin / SuperAdmin / Therapist — Cari berdasarkan nama pasien, tipe sesi, status, atau nama terapis
        const foundAppts = await db
          .select({
            id: appointments.id,
            patientName: patients.fullName,
            therapistName: users.name,
            date: appointments.scheduledDate,
            time: appointments.startTime,
            type: appointments.type,
            status: appointments.status,
          })
          .from(appointments)
          .leftJoin(patients, eq(appointments.patientId, patients.id))
          .leftJoin(users, eq(appointments.therapistId, users.id))
          .where(
            or(
              ilike(patients.fullName, `%${rawQ}%`),
              ilike(users.name, `%${rawQ}%`),
              ilike(appointments.type, `%${rawQ}%`),
              ilike(appointments.status, `%${rawQ}%`)
            )
          )
          .limit(5);

        for (const a of foundAppts) {
          results.push({
            id: `appt-${a.id}`,
            category: 'Jadwal',
            title: a.patientName ? `Jadwal ${a.patientName}` : `Sesi ${a.type}`,
            subtitle: `${a.type} • Terapis: ${a.therapistName || '-'} (${a.time})`,
            href: `/dashboard/appointments`,
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Rekam medis pasien sendiri (final dan dibagikan)
  if (role === 'USER') {
    try {
      const [pt] = await db
        .select({ id: patients.id })
        .from(patients)
        .where(eq(patients.userId, session.user.id))
        .limit(1);

      if (pt) {
        const foundRecords = await db
          .select({
            id: therapyProgressRecords.id,
            recordedAt: therapyProgressRecords.recordedAt,
            diagnosis: therapyProgressRecords.diagnosis,
            treatment: therapyProgressRecords.treatment,
            summary: therapyProgressRecords.summary,
          })
          .from(therapyProgressRecords)
          .where(
            and(
              eq(therapyProgressRecords.patientId, pt.id),
              eq(therapyProgressRecords.status, 'FINALIZED'),
              eq(therapyProgressRecords.patientVisible, 1),
              or(
                ilike(therapyProgressRecords.diagnosis, `%${rawQ}%`),
                ilike(therapyProgressRecords.treatment, `%${rawQ}%`),
                ilike(therapyProgressRecords.summary, `%${rawQ}%`),
                ilike(therapyProgressRecords.anamnesis, `%${rawQ}%`),
              ),
            ),
          )
          .orderBy(desc(therapyProgressRecords.recordedAt))
          .limit(4);

        for (const record of foundRecords) {
          results.push({
            id: `record-${record.id}`,
            category: 'Rekam Medis',
            title: `Evaluasi ${new Date(record.recordedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`,
            subtitle: record.diagnosis || record.summary || record.treatment || 'Catatan terapi final',
            href: '/dashboard/progress',
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Data Pengguna (Hanya SuperAdmin / Admin)
  if (hasPermission(role, PERMISSIONS.USER_READ)) {
    try {
      const foundUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          accountType: profiles.accountType,
        })
        .from(users)
        .leftJoin(profiles, eq(profiles.userId, users.id))
        .where(
          or(
            ilike(users.name, `%${rawQ}%`),
            ilike(users.email, `%${rawQ}%`)
          )
        )
        .limit(4);

      for (const u of foundUsers) {
        results.push({
          id: `user-${u.id}`,
          category: 'Pengguna',
          title: u.name || 'Pengguna',
          subtitle: `${u.accountType || 'USER'} • ${u.email}`,
          href: `/dashboard/users`,
        });
      }
    } catch {
      // ignore
    }
  }

  // 6. Log Audit (Hanya SuperAdmin)
  if (role === 'SUPER_ADMIN' && hasPermission(role, PERMISSIONS.AUDIT_READ)) {
    try {
      const foundLogs = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          targetType: auditLogs.targetType,
          targetId: auditLogs.targetId,
        })
        .from(auditLogs)
        .where(
          or(
            ilike(auditLogs.action, `%${rawQ}%`),
            ilike(auditLogs.targetType, `%${rawQ}%`),
            ilike(auditLogs.targetId, `%${rawQ}%`)
          )
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(3);

      for (const l of foundLogs) {
        results.push({
          id: `audit-${l.id}`,
          category: 'Audit',
          title: l.action,
          subtitle: l.targetType ? `Target: ${l.targetType}` : 'Log Audit Sistem',
          href: `/dashboard/audit-logs`,
        });
      }
    } catch {
      // ignore
    }
  }

  return results.slice(0, 8);
}
