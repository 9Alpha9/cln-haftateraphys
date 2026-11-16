export type AppErrorCode =
  | 400
  | 401
  | 403
  | 404
  | 408
  | 409
  | 413
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504;

export type ErrorInfo = {
  code: AppErrorCode;
  title: string;
  description: string;
  hint: string;
  tone: 'danger' | 'warning' | 'info';
};

const CATALOG: Record<AppErrorCode, ErrorInfo> = {
  400: {
    code: 400,
    title: 'Permintaan tidak valid',
    description: 'Data yang dikirim tidak dapat diproses. Periksa kembali isian Anda.',
    hint: 'Muat ulang halaman lalu coba lagi dengan data yang benar.',
    tone: 'warning',
  },
  401: {
    code: 401,
    title: 'Sesi Anda telah berakhir',
    description: 'Anda perlu masuk kembali untuk melanjutkan. Demi keamanan data medis, sesi tidak aktif otomatis diakhiri.',
    hint: 'Masuk kembali menggunakan akun Anda.',
    tone: 'warning',
  },
  403: {
    code: 403,
    title: 'Akses tidak diizinkan',
    description: 'Akun Anda tidak memiliki izin untuk membuka halaman atau data ini.',
    hint: 'Kembali ke dashboard atau hubungi admin jika Anda merasa ini sebuah kesalahan.',
    tone: 'danger',
  },
  404: {
    code: 404,
    title: 'Halaman tidak ditemukan',
    description: 'Halaman yang Anda cari tidak tersedia, sudah dipindahkan, atau tidak dapat diakses dari akun ini.',
    hint: 'Periksa alamat halaman atau kembali ke beranda.',
    tone: 'info',
  },
  408: {
    code: 408,
    title: 'Waktu permintaan habis',
    description: 'Server tidak menerima permintaan tepat waktu. Koneksi Anda mungkin lambat atau terputus.',
    hint: 'Periksa koneksi internet lalu coba lagi.',
    tone: 'warning',
  },
  409: {
    code: 409,
    title: 'Data sudah berubah',
    description: 'Data yang Anda buka sudah diperbarui oleh pengguna lain. Tindakan ini dibatalkan untuk mencegah konflik.',
    hint: 'Muat ulang halaman untuk melihat data terbaru sebelum mengulang tindakan.',
    tone: 'warning',
  },
  413: {
    code: 413,
    title: 'Berkas terlalu besar',
    description: 'Ukuran berkas yang diunggah melebihi batas yang diizinkan.',
    hint: 'Kompres atau pilih berkas lain yang lebih kecil.',
    tone: 'warning',
  },
  422: {
    code: 422,
    title: 'Data belum lengkap',
    description: 'Beberapa isian belum memenuhi aturan validasi. Periksa kembali kolom yang ditandai.',
    hint: 'Perbaiki isian lalu simpan kembali.',
    tone: 'warning',
  },
  429: {
    code: 429,
    title: 'Terlalu banyak permintaan',
    description: 'Sistem membatasi jumlah percobaan untuk melindungi akun dan data pasien.',
    hint: 'Tunggu beberapa saat sebelum mencoba lagi.',
    tone: 'warning',
  },
  500: {
    code: 500,
    title: 'Terjadi kesalahan pada server',
    description: 'Sistem gagal memproses permintaan Anda. Tim teknis dapat menelusuri masalah ini menggunakan referensi insiden.',
    hint: 'Coba muat ulang. Jika berulang, laporkan referensi insiden di bawah kepada admin.',
    tone: 'danger',
  },
  502: {
    code: 502,
    title: 'Layanan sedang tidak tersedia',
    description: 'Server menerima respons yang tidak valid dari layanan pendukung.',
    hint: 'Coba lagi beberapa saat lagi.',
    tone: 'danger',
  },
  503: {
    code: 503,
    title: 'Layanan sedang dalam pemeliharaan',
    description: 'Situs sedang tidak dapat diakses sementara waktu karena pemeliharaan.',
    hint: 'Kembali lagi setelah pemeliharaan selesai.',
    tone: 'warning',
  },
  504: {
    code: 504,
    title: 'Server tidak merespons',
    description: 'Permintaan memakan waktu terlalu lama untuk diselesaikan.',
    hint: 'Periksa koneksi lalu coba lagi.',
    tone: 'danger',
  },
};

const SUPPORTED_CODES = Object.keys(CATALOG).map(Number) as AppErrorCode[];

export function normalizeErrorCode(value: string | number | null | undefined): AppErrorCode {
  const code = Number(value);
  return SUPPORTED_CODES.includes(code as AppErrorCode) ? (code as AppErrorCode) : 500;
}

export function getErrorInfo(value: string | number | null | undefined): ErrorInfo {
  return CATALOG[normalizeErrorCode(value)];
}

/** Referensi aman untuk ditampilkan ke pengguna; tidak memuat data pasien. */
export function createIncidentReference(code: number, digest?: string | null): string {
  const suffix = digest?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
  if (suffix) return `HF-${code}-${suffix}`;
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return `HF-${code}-${stamp}`;
}

export function isSafePath(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith('/') && !value.startsWith('//'));
}
