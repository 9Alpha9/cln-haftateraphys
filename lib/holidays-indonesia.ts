export type HolidayType = 'nasional' | 'agama' | 'libur';

export type Holiday = {
  month: number;
  day: number;
  name: string;
  type: HolidayType;
};

/**
 * Hari libur nasional & agama Indonesia.
 * Libur bergerak (Idul Fitri, dll.) diisi per rentang tahun.
 * Update setiap tahun sebelum awal tahun baru.
 */
export const HOLIDAYS: Holiday[] = [
  // ─── Tetap (setiap tahun) ─────────────────────────────────
  { month: 1, day: 1, name: 'Tahun Baru Masehi', type: 'nasional' },
  { month: 1, day: 28, name: 'Isra Mi\'raj Nabi Muhammad SAW', type: 'agama' },
  { month: 1, day: 29, name: 'Tahun Baru Imlek', type: 'agama' },
  { month: 2, day: 3, name: 'Hari Lunar Baru (Cap Go Meh)', type: 'agama' },
  { month: 2, day: 28, name: 'Hari Raya Nyepi (Tahun Baru Saka)', type: 'agama' },
  { month: 3, day: 1, name: 'Hari Libur Nyepi', type: 'libur' },
  { month: 3, day: 3, name: 'Hari Raya Waisak', type: 'agama' },
  { month: 3, day: 29, name: 'Kenaikan Isa Almasih', type: 'agama' },
  { month: 3, day: 31, name: 'Hari Raya Idul Fitri 1447 H', type: 'agama' },
  { month: 4, day: 1, name: 'Hari Raya Idul Fitri 1447 H (Cuti)', type: 'libur' },
  { month: 4, day: 2, name: 'Hari Raya Idul Fitri 1447 H (Cuti)', type: 'libur' },
  { month: 4, day: 3, name: 'Hari Raya Idul Fitri 1447 H (Cuti)', type: 'libur' },
  { month: 4, day: 4, name: 'Hari Raya Idul Fitri 1447 H (Cuti)', type: 'libur' },
  { month: 4, day: 6, name: 'Hari Raya Idul Fitri 1447 H (Cuti)', type: 'libur' },
  { month: 4, day: 7, name: 'Hari Raya Idul Fitri 1447 H (Cuti)', type: 'libur' },
  { month: 5, day: 1, name: 'Hari Buruh Internasional', type: 'nasional' },
  { month: 5, day: 12, name: 'Hari Raya Waisak (Cuti)', type: 'libur' },
  { month: 5, day: 14, name: 'Kenaikan Isa Almasih (Cuti)', type: 'libur' },
  { month: 5, day: 29, name: 'Hari Raya Idul Adha 1447 H', type: 'agama' },
  { month: 5, day: 30, name: 'Hari Raya Idul Adha 1447 H (Cuti)', type: 'libur' },
  { month: 6, day: 1, name: 'Hari Lahir Pancasila', type: 'nasional' },
  { month: 6, day: 7, name: 'Tahun Baru Islam 1 Muharram 1449 H', type: 'agama' },
  { month: 6, day: 8, name: 'Tahun Baru Islam (Cuti)', type: 'libur' },
  { month: 7, day: 6, name: 'Hari Raya Maulid Nabi Muhammad SAW', type: 'agama' },
  { month: 7, day: 7, name: 'Maulid Nabi (Cuti)', type: 'libur' },
  { month: 8, day: 17, name: 'Hari Kemerdekaan RI', type: 'nasional' },
  { month: 8, day: 18, name: 'Hari Kemerdekaan RI (Cuti)', type: 'libur' },
  { month: 8, day: 27, name: 'Tahun Baru Imlek (Cuti)', type: 'libur' },
  { month: 10, day: 25, name: 'Hari Sumpah Pemuda', type: 'nasional' },
  { month: 11, day: 2, name: 'Hari Raya Maulid Nabi (Cuti)', type: 'libur' },
  { month: 11, day: 25, name: 'Hari Natal', type: 'agama' },
  { month: 11, day: 26, name: 'Hari Natal (Cuti)', type: 'libur' },
  { month: 12, day: 24, name: 'Malam Natal', type: 'libur' },
];

/**
 * Cek apakah tanggal tertentu adalah hari libur.
 */
export function getHoliday(month: number, day: number): Holiday | undefined {
  return HOLIDAYS.find((h) => h.month === month && h.day === day);
}
