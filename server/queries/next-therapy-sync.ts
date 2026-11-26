import { and, asc, eq, gt, gte, inArray, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointments, patients } from '@/db/schema';

const ACTIVE_APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED'] as const;

/** Kunci tanggal lokal `YYYY-MM-DD` (pola yang sama dengan appointment-requests). */
function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sinkronkan ringkasan `patients.nextTherapyAt` dengan sesi teraktif terdekat
 * milik pasien. Dipanggil setiap kali jadwal berubah — pembuatan, persetujuan,
 * perubahan, penghapusan, dan penyelesaian sesi — supaya kartu "Berikutnya"
 * di portal pasien selalu sama dengan data appointment (bukan salinan yang
 * bisa usang).
 *
 * - Ada sesi aktif mendatang → diisi sesi terdekat (tanggal + jam).
 * - Tidak ada → di-set NULL; portal menampilkan "belum dijadwalkan".
 * - Nilai manual dari form Jadwal Terapi tetap berlaku selama tidak ada
 *   perubahan appointment; begitu ada perubahan, appointment menjadi sumber
 *   kebenarannya.
 */
export async function syncNextTherapyAt(patientId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  const todayKey = localDateKey(now);
  const nowTimeText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [next] = await db
    .select({ scheduledDate: appointments.scheduledDate, startTime: appointments.startTime })
    .from(appointments)
    .where(
      and(
        eq(appointments.patientId, patientId),
        inArray(appointments.status, [...ACTIVE_APPOINTMENT_STATUSES]),
        // Sesi hari ini yang jam mulainya sudah lewat bukan lagi "berikutnya".
        or(
          gt(appointments.scheduledDate, todayKey),
          and(eq(appointments.scheduledDate, todayKey), gte(appointments.startTime, nowTimeText)),
        ),
      ),
    )
    .orderBy(asc(appointments.scheduledDate), asc(appointments.startTime))
    .limit(1);

  let nextTherapyAt: Date | null = null;
  if (next) {
    const [year, month, day] = next.scheduledDate.slice(0, 10).split('-').map(Number);
    const [hours, minutes] = next.startTime.split(':').map(Number);
    nextTherapyAt = new Date(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0);
  }

  await db.update(patients).set({ nextTherapyAt, updatedAt: new Date() }).where(eq(patients.id, patientId));
}
