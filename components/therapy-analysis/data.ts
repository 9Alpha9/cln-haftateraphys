/**
 * Mock data Dashboard Analisis Terapi & Kesehatan.
 * Terstruktur & bertipe agar tinggal ditukar dengan query API/database.
 * Semua nilai adalah dummy — tidak ada data pasien nyata.
 */

export type TherapyPoint = {
  id: string;
  partName: string;
  /** Posisi pin dalam persen relatif lebar/tinggi gambar anatomi. */
  x: number;
  y: number;
  /** Keluhan/diagnosis area. */
  condition: string;
  /** Metode terapi yang dijalankan. */
  therapyMethod: string;
  /** Progres pemulihan 0–100. */
  progress: number;
  therapistNotes: string;
};

export const THERAPY_POINTS: TherapyPoint[] = [
  {
    id: 'servikal',
    partName: 'Leher (Servikal)',
    x: 50,
    y: 9,
    condition: 'Nyeri leher postural akibat posisi kerja',
    therapyMethod: 'Peregangan aktif + edukasi postur kerja',
    progress: 55,
    therapistNotes: 'Setinggi layar kerja perlu disejajarkan dengan mata.',
  },
  {
    id: 'bahu-kiri',
    partName: 'Bahu Kiri',
    x: 37,
    y: 17,
    condition: 'Rotator cuff syndrome — nyeri saat mengangkat lengan',
    therapyMethod: 'Manual therapy + latihan penguatan rotator',
    progress: 68,
    therapistNotes: 'Hindari angkat beban di atas kepala minggu ini.',
  },
  {
    id: 'lumbar',
    partName: 'Punggung Bawah (Lumbar)',
    x: 50,
    y: 40,
    condition: 'Nyeri mekanik lumbal',
    therapyMethod: 'Latihan core stability + modalitas TENS',
    progress: 45,
    therapistNotes: 'Latihan core 10 menit per hari di rumah.',
  },
  {
    id: 'lutut-kanan',
    partName: 'Lutut Kanan',
    x: 58,
    y: 76,
    condition: 'Osteoarthritis derajat 1',
    therapyMethod: 'Terapi latihan + kinesio taping',
    progress: 72,
    therapistNotes: 'Kurangi lari jarak jauh selama pemulihan.',
  },
];

export const BLOOD_STATUS = {
  label: 'Kondisi Darah',
  value: '120/85',
  unit: 'mmHg',
  badge: 'Normal',
  /** Titik polyline ECG (viewBox 0 0 120 40). */
  ecgPoints: '0,20 10,20 14,8 18,32 22,20 34,20 44,20 48,10 52,30 56,20 70,20 84,20 88,6 92,34 96,20 120,20',
};

export const HEMOGLOBIN_LEVEL = {
  label: 'Hemoglobin',
  value: '17.2',
  unit: 'g/dl',
  badge: 'Normal',
  /** Path kurva halus (viewBox 0 0 120 40). */
  curvePath: 'M0 30 C 15 30, 20 10, 35 14 S 55 34, 70 20 S 100 6, 120 12',
};

export const HEARTRATE_ACTIVITY = {
  label: 'Aktivitas Detak Jantung',
  subtitle: 'Rata-rata pria dewasa',
  value: '120',
  unit: 'bpm',
};

export type LabItem = {
  id: string;
  name: string;
  kind: 'resep' | 'pemeriksaan';
};

export const LAB_ITEMS: LabItem[] = [
  { id: 'resep-1', name: 'Resep 1 — Analgesik topikal', kind: 'resep' },
  { id: 'ct-scan', name: 'CT Scan — Lumbar', kind: 'pemeriksaan' },
  { id: 'resep-2', name: 'Resep 2 — Relaksan otot', kind: 'resep' },
  { id: 'usg', name: 'Ultrasonografi — Bahu', kind: 'pemeriksaan' },
];

export type AppointmentCard = {
  id: string;
  initials: string;
  initialsClass: string;
  name: string;
  role: string;
  visitTime: string;
};

export const APPOINTMENTS: AppointmentCard[] = [
  {
    id: 'apt-1',
    initials: 'H1',
    initialsClass: 'bg-[#FEF9C3] text-[#713F12]',
    name: 'Hafta Terapis 1',
    role: 'Fisioterapis, MD',
    visitTime: 'Kunjungan: 10:20 | 24 Juli 2026',
  },
  {
    id: 'apt-2',
    initials: 'H2',
    initialsClass: 'bg-[#E0F2FE] text-[#075985]',
    name: 'Hafta Terapis 2',
    role: 'Fisioterapis, MD',
    visitTime: 'Kunjungan: 09:00 | 26 Juli 2026',
  },
];

export type MedicineCard = {
  id: string;
  name: string;
  dose: string;
  surfaceClass: string;
};

export const MEDICINES: MedicineCard[] = [
  { id: 'med-1', name: 'Injeksi Vitamin B', dose: '5ml', surfaceClass: 'bg-[#FEF9C3]' },
  { id: 'med-2', name: 'Kapsul Vitamin B', dose: '10mg', surfaceClass: 'bg-[#E0F2FE]' },
  { id: 'med-3', name: 'Kapsul MaxPro', dose: '20mg', surfaceClass: 'bg-[#DCFCE7]' },
];

export const AI_ANALYTICS = {
  badge: 'AI ANALYTICS',
  title: 'Fraktur Vertebral',
  description:
    'Analisis AI mendeteksi penurunan tinggi vertebral pada area lumbal. Konsultasikan hasil ini dengan fisioterapis Anda.',
};

/** Konfigurasi ruler Body Mass Index — satu set per mode. */
export const BMI_RANGES: Record<
  'weight' | 'height',
  { label: string; ticks: number[]; initial: number; unit: string }
> = {
  weight: { label: 'Berat', ticks: [63, 64, 65, 66, 67, 68, 69], initial: 66, unit: 'kg' },
  height: { label: 'Tinggi', ticks: [160, 163, 166, 169, 172], initial: 166, unit: 'cm' },
};
