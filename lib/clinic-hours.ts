/**
 * Satu sumber kebenaran jam operasional.
 *
 * Disinkronkan dengan Google Business Profile "Hafta Fisioterapi Sidoarjo"
 * (per 16 November 2026): Senin–Jumat 09.00–19.00, Sabtu 09.00–17.00,
 * Minggu tutup. Update di sini agar landing page dan halaman kontak tidak
 * berbeda.
 */
export const CLINIC_HOURS = [
  { day: 'Senin – Jumat', hours: '09.00 – 19.00 WIB' },
  { day: 'Sabtu', hours: '09.00 – 17.00 WIB' },
  { day: 'Minggu', hours: 'Tutup' },
] as const;

export const CLINIC_TIME_ZONE = 'Asia/Jakarta';
