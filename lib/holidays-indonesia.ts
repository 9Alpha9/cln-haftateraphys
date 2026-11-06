export type HolidayType = 'nasional' | 'agama' | 'libur';

export type Holiday = {
  month: number;
  day: number;
  name: string;
  type: HolidayType;
};

type HolidaySeed = [month: number, day: number, name: string, type: HolidayType];

function buildYear(entries: HolidaySeed[]): Holiday[] {
  return entries.map(([month, day, name, type]) => ({ month, day, name, type }));
}

/**
 * Hari libur nasional & cuti bersama Indonesia.
 *
 * Sumber:
 * - 2025: SKB 3 Menteri Nomor 1017/2/2 Tahun 2024 + perubahan (18 Agustus 2025).
 * - 2026: SKB 3 Menteri Tahun 2026 (dataset resmi libur-nasional).
 * - 2027: SKB 3 Menteri Nomor 1205/3/2 Tahun 2026.
 *
 * `libur` = cuti bersama, `agama` = hari besar keagamaan, `nasional` = hari besar nasional.
 */
export const HOLIDAYS_BY_YEAR: Record<number, Holiday[]> = {
  2025: buildYear([
    [1, 1, 'Tahun Baru 2025 Masehi', 'nasional'],
    [1, 27, 'Isra Mikraj Nabi Muhammad SAW', 'agama'],
    [1, 28, 'Cuti Bersama Tahun Baru Imlek', 'libur'],
    [1, 29, 'Tahun Baru Imlek 2576 Kongzili', 'agama'],
    [3, 28, 'Cuti Bersama Hari Suci Nyepi', 'libur'],
    [3, 29, 'Hari Suci Nyepi (Tahun Baru Saka 1947)', 'agama'],
    [3, 31, 'Idul Fitri 1446 Hijriah', 'agama'],
    [4, 1, 'Idul Fitri 1446 Hijriah', 'agama'],
    [4, 2, 'Cuti Bersama Idul Fitri', 'libur'],
    [4, 3, 'Cuti Bersama Idul Fitri', 'libur'],
    [4, 4, 'Cuti Bersama Idul Fitri', 'libur'],
    [4, 7, 'Cuti Bersama Idul Fitri', 'libur'],
    [4, 18, 'Wafat Yesus Kristus', 'agama'],
    [4, 20, 'Kebangkitan Yesus Kristus (Paskah)', 'agama'],
    [5, 1, 'Hari Buruh Internasional', 'nasional'],
    [5, 12, 'Hari Raya Waisak 2596 BE', 'agama'],
    [5, 13, 'Cuti Bersama Hari Raya Waisak', 'libur'],
    [5, 29, 'Kenaikan Yesus Kristus', 'agama'],
    [5, 30, 'Cuti Bersama Kenaikan Yesus Kristus', 'libur'],
    [6, 1, 'Hari Lahir Pancasila', 'nasional'],
    [6, 6, 'Idul Adha 1446 Hijriah', 'agama'],
    [6, 9, 'Cuti Bersama Idul Adha', 'libur'],
    [6, 27, '1 Muharam Tahun Baru Islam 1447 Hijriah', 'agama'],
    [8, 17, 'Proklamasi Kemerdekaan', 'nasional'],
    [8, 18, 'Cuti Bersama Hari Kemerdekaan', 'libur'],
    [9, 5, 'Maulid Nabi Muhammad SAW', 'agama'],
    [12, 25, 'Kelahiran Yesus Kristus (Natal)', 'agama'],
    [12, 26, 'Cuti Bersama Kelahiran Yesus Kristus', 'libur'],
  ]),
  2026: buildYear([
    [1, 1, 'Tahun Baru 2026 Masehi', 'nasional'],
    [1, 16, 'Isra Mikraj Nabi Muhammad SAW', 'agama'],
    [2, 16, 'Cuti Bersama Tahun Baru Imlek', 'libur'],
    [2, 17, 'Tahun Baru Imlek 2577 Kongzili', 'agama'],
    [3, 18, 'Cuti Bersama Hari Suci Nyepi', 'libur'],
    [3, 19, 'Hari Suci Nyepi (Tahun Baru Saka 1948)', 'agama'],
    [3, 20, 'Cuti Bersama Idul Fitri', 'libur'],
    [3, 21, 'Idul Fitri 1447 Hijriah', 'agama'],
    [3, 22, 'Idul Fitri 1447 Hijriah', 'agama'],
    [3, 23, 'Cuti Bersama Idul Fitri', 'libur'],
    [3, 24, 'Cuti Bersama Idul Fitri', 'libur'],
    [4, 3, 'Wafat Yesus Kristus', 'agama'],
    [4, 5, 'Kebangkitan Yesus Kristus (Paskah)', 'agama'],
    [5, 1, 'Hari Buruh Internasional', 'nasional'],
    [5, 14, 'Kenaikan Yesus Kristus', 'agama'],
    [5, 15, 'Cuti Bersama Kenaikan Yesus Kristus', 'libur'],
    [5, 27, 'Idul Adha 1447 Hijriah', 'agama'],
    [5, 28, 'Cuti Bersama Idul Adha', 'libur'],
    [5, 31, 'Hari Raya Waisak 2570 BE', 'agama'],
    [6, 1, 'Hari Lahir Pancasila', 'nasional'],
    [6, 16, '1 Muharam Tahun Baru Islam 1448 Hijriah', 'agama'],
    [8, 17, 'Proklamasi Kemerdekaan', 'nasional'],
    [8, 25, 'Maulid Nabi Muhammad SAW', 'agama'],
    [12, 24, 'Cuti Bersama Kelahiran Yesus Kristus', 'libur'],
    [12, 25, 'Kelahiran Yesus Kristus (Natal)', 'agama'],
  ]),
  2027: buildYear([
    [1, 1, 'Tahun Baru 2027 Masehi', 'nasional'],
    [1, 5, 'Isra Mikraj Nabi Muhammad SAW 1448 Hijriah', 'agama'],
    [2, 5, 'Cuti Bersama Tahun Baru Imlek', 'libur'],
    [2, 6, 'Tahun Baru Imlek 2578 Kongzili', 'agama'],
    [3, 8, 'Hari Suci Nyepi (Tahun Baru Saka 1949)', 'agama'],
    [3, 9, 'Cuti Bersama Idul Fitri', 'libur'],
    [3, 10, 'Idul Fitri 1448 Hijriah', 'agama'],
    [3, 11, 'Idul Fitri 1448 Hijriah', 'agama'],
    [3, 12, 'Cuti Bersama Idul Fitri', 'libur'],
    [3, 15, 'Cuti Bersama Idul Fitri', 'libur'],
    [3, 25, 'Cuti Bersama Wafat Yesus Kristus', 'libur'],
    [3, 26, 'Wafat Yesus Kristus', 'agama'],
    [3, 28, 'Kebangkitan Yesus Kristus (Paskah)', 'agama'],
    [5, 1, 'Hari Buruh Internasional', 'nasional'],
    [5, 6, 'Kenaikan Yesus Kristus', 'agama'],
    [5, 17, 'Idul Adha 1448 Hijriah', 'agama'],
    [5, 18, 'Cuti Bersama Idul Adha', 'libur'],
    [5, 19, 'Cuti Bersama Hari Raya Waisak', 'libur'],
    [5, 20, 'Hari Raya Waisak 2571 BE', 'agama'],
    [6, 1, 'Hari Lahir Pancasila', 'nasional'],
    [6, 6, '1 Muharam Tahun Baru Islam 1449 Hijriah', 'agama'],
    [8, 15, 'Maulid Nabi Muhammad SAW', 'agama'],
    [8, 17, 'Proklamasi Kemerdekaan', 'nasional'],
    [12, 24, 'Cuti Bersama Kelahiran Yesus Kristus', 'libur'],
    [12, 25, 'Kelahiran Yesus Kristus (Natal)', 'agama'],
    [12, 26, 'Isra Mikraj Nabi Muhammad SAW 1449 Hijriah', 'agama'],
  ]),
};

/** Sebagian tahun belum tersedia di dataset lokal (mis. 2028+). */
export function getHolidaysForYear(year: number): Holiday[] {
  return HOLIDAYS_BY_YEAR[year] ?? [];
}

/**
 * Cek apakah tanggal tertentu adalah hari libur.
 */
export function getHoliday(year: number, month: number, day: number): Holiday | undefined {
  return getHolidaysForYear(year).find((h) => h.month === month && h.day === day);
}
