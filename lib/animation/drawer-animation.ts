/**
 * Konfigurasi animasi drawer (slide-over) yang konsisten di seluruh aplikasi.
 *
 * Semua drawer (Detail Pasien, Rekam Medis, Appointment, Treatment Plan,
 * Program Latihan, Intake Detail, dan lainnya) melewati `GlobalSlideOver`,
 * sehingga mengubah nilai di sini akan meredam seluruh drawer sekaligus.
 *
 * Lifecycle konsisten: CLOSED → OPENING → OPEN → CLOSING → CLOSED.
 * Drawer tidak akan di-unmount sebelum exit animation selesai (dihadiri oleh
 * framer-motion `AnimatePresence`).
 */

export const DRAWER_ANIMATION = {
  /** Durasi buka dan tutup (detik). Sama untuk open dan close. */
  duration: 0.25,

  /** Easing buka dan tutup: ease-out cubic-bezier yang halus. */
  easing: [0.2, 0, 0, 1] as const,

  /** Backdrop fade sedikit lebih cepat dari panel agar terasa responsif. */
  backdropDuration: 0.2,

  /** Easing backdrop: easeOut standar. */
  backdropEasing: 'easeOut' as const,

  /** Panel slide dari kanan ke kiri (desktop) / penuh tinggi (mobile). */
  slideFrom: '100%' as const,
} as const;

/** Label status lifecycle drawer untuk debugging dan audit. */
export type DrawerLifecycle = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING' | 'CLOSED';
