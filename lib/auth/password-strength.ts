export const MIN_PASSWORD_LENGTH = 8;

/** Panjang yang memberi bonus skor: password panjang lebih diutamakan daripada aturan komposisi. */
const RECOMMENDED_PASSWORD_LENGTH = 12;

export type PasswordStrengthLabel = 'Kurang Kuat' | 'Sedang' | 'Kuat';

/** 0 = Kurang Kuat, 1 = Sedang, 2 = Kuat. */
export type PasswordStrengthLevel = 0 | 1 | 2;

export type PasswordStrengthTone = 'danger' | 'warning' | 'success';

export interface PasswordStrength {
  /** Skor mentah 0–4. */
  score: number;
  level: PasswordStrengthLevel;
  label: PasswordStrengthLabel;
  tone: PasswordStrengthTone;
  /** Jumlah segmen bar yang terisi (1–4). Pada skor 0 tetap 1 agar bar tidak kosong. */
  filledSegments: number;
  /** True bila sudah memenuhi syarat minimum. */
  meetsMinimumLength: boolean;
  /** Syarat yang belum terpenuhi, hanya dipakai setelah pengguna mulai mengetik. */
  pendingHints: string[];
}

/**
 * Menilai kekuatan kata sandi tanpa dependensi eksternal dan tanpa mengirim
 * apa pun ke jaringan (tidak ada data pasien yang keluar dari browser).
 *
 * Skor sengaja sederhana dan length-first sesuai `docs/SECURITY.md`:
 * panjang minimal 8 karakter, ditambah variasi karakter dan bonus panjang.
 * Indikator ini informatif saja — aturan yang mengikat tetap validasi server.
 */
export function evaluatePasswordStrength(value: string): PasswordStrength {
  const length = value.length;
  const meetsMinimumLength = length >= MIN_PASSWORD_LENGTH;

  if (length === 0 || !meetsMinimumLength) {
    return {
      score: 0,
      level: 0,
      label: 'Kurang Kuat',
      tone: 'danger',
      filledSegments: 1,
      meetsMinimumLength,
      pendingHints:
        length === 0
          ? []
          : [`Tambah ${MIN_PASSWORD_LENGTH - length} karakter lagi (minimal ${MIN_PASSWORD_LENGTH}).`],
    };
  }

  const variety = [/\p{Ll}/u.test(value), /\p{Lu}/u.test(value), /\p{N}/u.test(value), /[^\p{L}\p{N}]/u.test(value)].filter(
    Boolean,
  ).length;

  const score = Math.min(4, variety + (length >= RECOMMENDED_PASSWORD_LENGTH ? 1 : 0));

  if (score >= 3) {
    return {
      score,
      level: 2,
      label: 'Kuat',
      tone: 'success',
      filledSegments: 4,
      meetsMinimumLength,
      pendingHints: [],
    };
  }

  if (score === 2) {
    return {
      score,
      level: 1,
      label: 'Sedang',
      tone: 'warning',
      filledSegments: 2,
      meetsMinimumLength,
      pendingHints: [`Gunakan ${RECOMMENDED_PASSWORD_LENGTH} karakter atau lebih agar lebih kuat.`],
    };
  }

  return {
    score,
    level: 0,
    label: 'Kurang Kuat',
    tone: 'danger',
    filledSegments: 1,
    meetsMinimumLength,
    pendingHints: [
      'Variasikan huruf besar, huruf kecil, angka, atau simbol.',
      `Gunakan ${RECOMMENDED_PASSWORD_LENGTH} karakter atau lebih agar lebih kuat.`,
    ],
  };
}
