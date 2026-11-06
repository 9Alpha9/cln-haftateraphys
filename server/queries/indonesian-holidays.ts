import { getHolidaysForYear } from '@/lib/holidays-indonesia';

type HolidayApiResponse = {
  success: boolean;
  data?: Array<{ date: string; name: string; is_cuti_bersama?: boolean }>;
};

export type IndonesianHoliday = { date: string; name: string; isCutiBersama: boolean };

export async function getIndonesianHolidays(year: number): Promise<IndonesianHoliday[]> {
  // Dataset lokal adalah sumber utama untuk 2025–2027 (sudah diverifikasi dari
  // SKB 3 Menteri). API hanya fallback untuk tahun lain/belum tersedia.
  const local = getHolidaysForYear(year);
  if (local.length > 0) {
    return local.map((holiday) => ({
      date: `${year}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`,
      name: holiday.name,
      isCutiBersama: holiday.type === 'libur',
    }));
  }

  try {
    const response = await fetch(`https://api.kemendesa.link/libur-nasional/api/holidays/${year}.json`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as HolidayApiResponse;
    if (!payload.success || !Array.isArray(payload.data)) return [];
    return payload.data.map((holiday) => ({
      date: holiday.date,
      name: holiday.name,
      isCutiBersama: Boolean(holiday.is_cuti_bersama),
    }));
  } catch {
    return [];
  }
}
