/**
 * Registresi aset Atlas anatomi (WebP) + peta koordinat penanda klinis.
 *
 * Sumber dimensi: `public/assets/body-anatomy/manifest.json` (versi 1).
 * Aset dimuat LAZY oleh viewer — registry ini tidak memuat apa pun.
 *
 * Koordinat penanda = persen lebar/tinggi ASSET (dinormalisasi ke gambar,
 * bukan bbox), dikalibrasi dari profil alpha siluet tiap aset
 * (kepala → leher → bahu → lengan → pinggang → pinggul → lutut → pergelangan)
 * pada 2026-11-26. Setiap aset punya peta sendiri — TIDAK dipakai lintas
 * sistem/view.
 *
 * Konvensi kolom: `x` = posisi sisi KANAN pasien, `altX` = sisi KIRI pasien.
 * Tampak depan (anterior): kanan pasien = kiri gambar (x kecil).
 * Tampak belakang (posterior): kanan pasien = kanan gambar (x besar).
 * Area tunggal (kepala, leher, dada, …) tanpa `altX`.
 */

import type { BodyRegionKey } from '@/components/patient/body-condition-map';

export type AnatomySystemKey = 'muscular' | 'skeletal' | 'nervous' | 'articular';
export type AnatomyViewKey = 'anterior' | 'posterior';

export type AnatomyAsset = {
  id: string;
  label: string;
  url: string;
  width: number;
  height: number;
};

/** Sistem anatomi utama + aset per tampakan (null = tidak tersedia). */
export const ANATOMY_SYSTEMS: {
  key: AnatomySystemKey;
  label: string;
  anterior: AnatomyAsset;
  posterior: AnatomyAsset | null;
}[] = [
  {
    key: 'muscular',
    label: 'Otot',
    anterior: {
      id: 'muscular-anterior',
      label: 'Otot tampak depan',
      url: '/assets/body-anatomy/muscular-anterior.webp',
      width: 841,
      height: 1510,
    },
    posterior: {
      id: 'muscular-posterior',
      label: 'Otot tampak belakang',
      url: '/assets/body-anatomy/muscular-posterior.webp',
      width: 814,
      height: 1525,
    },
  },
  {
    key: 'skeletal',
    label: 'Kerangka',
    anterior: {
      id: 'skeletal-anterior',
      label: 'Kerangka tampak depan',
      url: '/assets/body-anatomy/skeletal-anterior.webp',
      width: 769,
      height: 1520,
    },
    posterior: {
      id: 'skeletal-posterior',
      label: 'Kerangka tampak belakang',
      url: '/assets/body-anatomy/skeletal-posterior.webp',
      width: 811,
      height: 1650,
    },
  },
  {
    key: 'nervous',
    label: 'Saraf',
    anterior: {
      id: 'nervous-anterior',
      label: 'Saraf tampak depan',
      url: '/assets/body-anatomy/nervous-anterior.webp',
      width: 801,
      height: 1525,
    },
    posterior: {
      id: 'nervous-posterior',
      label: 'Saraf tampak belakang',
      url: '/assets/body-anatomy/nervous-posterior.webp',
      width: 786,
      height: 1520,
    },
  },
  {
    key: 'articular',
    label: 'Sendi',
    anterior: {
      id: 'articular-system',
      label: 'Sendi dan ligamen',
      url: '/assets/body-anatomy/articular-system.webp',
      width: 521,
      height: 892,
    },
    // Tidak ada aset posterior untuk sistem sendi — tombol "Belakang"
    // dinonaktifkan; anterior TIDAK di-mirror sebagai posterior palsu.
    posterior: null,
  },
];

/** Peta penanda klinis per aset (persen lebar/tinggi gambar). */
export const ANATOMY_MARKER_POSITIONS: Record<string, Record<BodyRegionKey, { x: number; y: number; altX?: number }>> =
  {
    'muscular-anterior': {
      kepala: { x: 50, y: 6.4 },
      leher: { x: 50, y: 12.5 },
      bahu: { x: 31, y: 29, altX: 68.6 },
      lengan: { x: 27.2, y: 35.2, altX: 72.3 },
      dada: { x: 50, y: 33.9 },
      perut: { x: 50, y: 43.8 },
      punggung: { x: 50, y: 43.8 },
      pinggul: { x: 44, y: 58.7, altX: 56 },
      lutut: { x: 37.8, y: 77.2, altX: 61.4 },
      kaki: { x: 35.7, y: 96.7, altX: 63.4 },
    },
    'muscular-posterior': {
      kepala: { x: 50, y: 6.2 },
      leher: { x: 50, y: 12.3 },
      bahu: { x: 68.9, y: 28.5, altX: 30.6 },
      lengan: { x: 72.9, y: 34.6, altX: 26.8 },
      dada: { x: 50, y: 33.5 },
      perut: { x: 50, y: 43.4 },
      punggung: { x: 50, y: 43.4 },
      pinggul: { x: 56, y: 58.4, altX: 44 },
      lutut: { x: 61.5, y: 77, altX: 38.4 },
      kaki: { x: 62, y: 96.7, altX: 37.6 },
    },
    'skeletal-anterior': {
      kepala: { x: 50, y: 6.5 },
      leher: { x: 50, y: 12.2 },
      bahu: { x: 37.2, y: 17.2, altX: 62.7 },
      lengan: { x: 33.2, y: 23.3, altX: 67.1 },
      dada: { x: 50, y: 22.2 },
      perut: { x: 50, y: 33.3 },
      punggung: { x: 50, y: 33.3 },
      pinggul: { x: 44, y: 49.3, altX: 56 },
      lutut: { x: 38.4, y: 71.9, altX: 61.3 },
      kaki: { x: 37.7, y: 96.6, altX: 62.1 },
    },
    'skeletal-posterior': {
      kepala: { x: 50, y: 6 },
      leher: { x: 50, y: 11.6 },
      bahu: { x: 58.8, y: 16.5, altX: 39 },
      lengan: { x: 63.6, y: 22.7, altX: 35.8 },
      dada: { x: 50, y: 21.5 },
      perut: { x: 50, y: 32.6 },
      punggung: { x: 50, y: 32.6 },
      pinggul: { x: 56, y: 48.7, altX: 44 },
      lutut: { x: 60.5, y: 71.6, altX: 38.8 },
      kaki: { x: 61.9, y: 96.7, altX: 37.6 },
    },
    'nervous-anterior': {
      kepala: { x: 50, y: 6.4 },
      leher: { x: 50, y: 12.3 },
      bahu: { x: 31.6, y: 28.5, altX: 68 },
      lengan: { x: 28.2, y: 34.8, altX: 71.5 },
      dada: { x: 50, y: 33.5 },
      perut: { x: 50, y: 43.3 },
      punggung: { x: 50, y: 43.3 },
      pinggul: { x: 44, y: 58.2, altX: 56 },
      lutut: { x: 39.2, y: 76.9, altX: 60.5 },
      kaki: { x: 37, y: 96.8, altX: 62.6 },
    },
    'nervous-posterior': {
      kepala: { x: 50, y: 6.5 },
      leher: { x: 50, y: 12.4 },
      bahu: { x: 69.6, y: 28.4, altX: 31.3 },
      lengan: { x: 73.2, y: 34.5, altX: 27.7 },
      dada: { x: 50, y: 33.4 },
      perut: { x: 50, y: 43.2 },
      punggung: { x: 50, y: 43.2 },
      pinggul: { x: 56, y: 58, altX: 44 },
      lutut: { x: 62.7, y: 76.7, altX: 38.2 },
      kaki: { x: 62.8, y: 96.6, altX: 38.1 },
    },
    'articular-system': {
      kepala: { x: 50, y: 6.4 },
      leher: { x: 50, y: 12.6 },
      bahu: { x: 32, y: 29, altX: 67.5 },
      lengan: { x: 28.3, y: 35.3, altX: 71 },
      dada: { x: 50, y: 34.1 },
      perut: { x: 50, y: 44 },
      punggung: { x: 50, y: 44 },
      pinggul: { x: 44, y: 58.9, altX: 56 },
      lutut: { x: 39.1, y: 77.2, altX: 60.2 },
      kaki: { x: 38.5, y: 96.6, altX: 61 },
    },
  };

/** Aset aktif untuk sistem + tampakan tertentu. */
export function atlasAsset(system: AnatomySystemKey, view: AnatomyViewKey): AnatomyAsset {
  const entry = ANATOMY_SYSTEMS.find((item) => item.key === system);
  const asset = view === 'posterior' ? entry?.posterior : entry?.anterior;
  // Fallback aman: sistem tanpa aset posterior kembali ke anterior.
  return asset ?? entry?.anterior ?? ANATOMY_SYSTEMS[0].anterior;
}

/**
 * Posisi penanda area (persen aset) untuk sisi keluhan tertentu.
 * `side === 'kiri'` memakai kolom `altX` (sisi KIRI pasien).
 */
export function markerPosition(
  assetId: string,
  region: BodyRegionKey,
  side: 'kiri' | 'kanan' | null,
): { x: number; y: number } {
  const map = ANATOMY_MARKER_POSITIONS[assetId];
  const point = map?.[region] ?? { x: 50, y: 50 };
  const x = side === 'kiri' && point.altX !== undefined ? point.altX : point.x;
  return { x, y: point.y };
}
