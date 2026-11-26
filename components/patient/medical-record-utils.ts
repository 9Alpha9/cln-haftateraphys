/**
 * Formatter & konfigurasi metrik bersama untuk tampilan rekam medis pasien.
 * Dipakai oleh halaman rekam medis (Kondisi Terkini, Diagnosis, detail drawer)
 * dan workspace Perjalanan Pemulihan.
 */

import { Activity, HeartPulse, TrendingUp } from 'lucide-react';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';

export type Tone = 'good' | 'watch' | 'alert';

export function metricTone(key: string, score: number): { tone: Tone; label: string } {
  const value = Math.max(0, Math.min(10, Number(score)));
  if (key === 'pain') {
    if (value <= 3) return { tone: 'good', label: 'Ringan' };
    if (value <= 6) return { tone: 'watch', label: 'Sedang' };
    return { tone: 'alert', label: 'Tinggi' };
  }
  if (value >= 8) return { tone: 'good', label: 'Optimal' };
  if (value >= 6) return { tone: 'watch', label: 'Baik' };
  return { tone: 'alert', label: 'Rendah' };
}

export const TONE_PILL: Record<Tone, string> = {
  good: 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
  watch: 'bg-[var(--hafta-50)] text-[var(--hafta-700)]',
  alert: 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]',
};

/** Warna isi jalur skor 0–10 pada kartu metrik (mengikuti nada hasil). */
export const TONE_TRACK: Record<Tone, string> = {
  good: 'bg-[var(--hafta-grn-500)]',
  watch: 'bg-[var(--hafta-300)]',
  alert: 'bg-[var(--hafta-red-500)]',
};

export const TONE_DELTA: Record<'up' | 'down', string> = {
  up: 'text-[var(--hafta-grn-600)]',
  down: 'text-[var(--hafta-red-600)]',
};

export const labelRecordStatus = (value: TherapyProgressView['status']) => (value === 'FINALIZED' ? 'Final' : 'Draf');

export const shortDate = (value: Date) =>
  value.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export const longDate = (value: Date) =>
  value.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const CLINICAL_ROWS: { label: string; field: keyof TherapyProgressView }[] = [
  { label: 'Anamnesis', field: 'anamnesis' },
  { label: 'Pemeriksaan fisik', field: 'physicalExamination' },
  { label: 'Diagnosis fisioterapi', field: 'diagnosis' },
  { label: 'Tindakan', field: 'treatment' },
  { label: 'Rencana tindak lanjut', field: 'followUpPlan' },
  { label: 'Ringkasan sesi', field: 'summary' },
];

export const METRICS: {
  key: 'pain' | 'rom' | 'strength' | 'function';
  label: string;
  field: keyof TherapyProgressView;
  icon: typeof HeartPulse;
}[] = [
  { key: 'pain', label: 'Nyeri', field: 'painScore', icon: HeartPulse },
  { key: 'rom', label: 'Rentang Gerak', field: 'rangeOfMotionScore', icon: Activity },
  { key: 'strength', label: 'Kekuatan', field: 'strengthScore', icon: TrendingUp },
  { key: 'function', label: 'Fungsi', field: 'functionScore', icon: Activity },
];

export function deltaLabel(current: number, previous: number | null) {
  if (previous === null) return null;
  const diff = Number(current) - Number(previous);
  if (diff === 0) return null;
  return { text: `${diff > 0 ? '+' : ''}${diff}`, direction: diff > 0 ? ('up' as const) : ('down' as const) };
}

/** Delta dengan arah "baik/buruk": untuk Nyeri, turun = baik. */
export function deltaForMetric(key: string, current: number, previous: number | null) {
  const change = deltaLabel(current, previous);
  if (!change) return null;
  const isGood = key === 'pain' ? change.direction === 'down' : change.direction === 'up';
  return { ...change, isGood };
}

/** Titik polyline sparkline 0..max → viewBox 120×40 (data sesi nyata). */
export function sparklinePoints(values: number[], max: number): string {
  if (values.length === 0) return '';
  const step = values.length === 1 ? 0 : 120 / (values.length - 1);
  return values
    .map((value, index) => {
      const x = (index * step).toFixed(1);
      const y = (36 - (Math.max(0, Math.min(max, value)) / max) * 30).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');
}
