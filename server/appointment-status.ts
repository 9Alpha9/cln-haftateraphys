/**
 * Aturan status jadwal terapi — fungsi murni tanpa akses database sehingga
 * aman dipakai dari server action, query, UI klien, maupun unit test.
 *
 * Aturan bisnis:
 * - Lewat jam mulai → jadwal terkunci: tidak boleh diubah/dijadwalkan ulang,
 *   hanya bisa diselesaikan atau ditandai tidak hadir.
 * - Lewat jam mulai + 24 jam tanpa penyelesaian → sesi dianggap mangkir dan
 *   layak ditandai NO_SHOW (otomatis oleh sweep atau manual oleh terapis).
 */

/** Grace period: sesi yang lewat 24 jam sejak jam mulai dianggap mangkir. */
export const NO_SHOW_GRACE_MS = 24 * 60 * 60 * 1000;

/** Kunci tanggal lokal `YYYY-MM-DD` (pola yang sama dengan query jadwal). */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Jam mulai sesi (waktu lokal server) dari kolom tanggal + jam. */
export function appointmentStartAt(scheduledDate: string, startTime: string): Date {
  const [year, month, day] = scheduledDate.slice(0, 10).split('-').map(Number);
  // `startTime` tersimpan sebagai text 'HH:MM' atau 'HH:MM:SS' — parsing
  // per bagian aman untuk keduanya (pola yang sama dengan kode jadwal lain).
  const [hours = 0, minutes = 0] = startTime.split(':').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, hours, minutes);
}

/** true bila jam mulai sesi sudah lewat — jadwal terkunci untuk perubahan. */
export function isAppointmentStartPassed(
  scheduledDate: string,
  startTime: string,
  now: Date = new Date(),
): boolean {
  const start = appointmentStartAt(scheduledDate, startTime);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() <= now.getTime();
}

/** true bila sesi melewati jam mulai + 24 jam dan belum diselesaikan → NO_SHOW. */
export function isNoShowDue(
  scheduledDate: string,
  startTime: string,
  now: Date = new Date(),
): boolean {
  const start = appointmentStartAt(scheduledDate, startTime);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() + NO_SHOW_GRACE_MS < now.getTime();
}
