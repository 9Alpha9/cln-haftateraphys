import { Activity, Stethoscope, Heart, Footprints, type LucideIcon } from 'lucide-react';

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
  backgroundImage: string;
  gradient: string;
  status: 'CONFIRMED' | 'PLACEHOLDER';
  conditions: string[];
  benefits: string[];
};

export const services: Service[] = [
  {
    id: 'cedera-olahraga',
    title: 'Cedera Olahraga',
    description:
      'Pemulihan cedera olahraga seperti sprain, strain, dan rehabilitasi pasca operasi untuk kembali ke aktivitas.',
    icon: Activity,
    image: '/images/models/model-patient-2.png',
    backgroundImage: '/images/backgrounds/bg-hf-1.png',
    gradient: 'from-emerald-900/90 to-emerald-800/70',
    status: 'PLACEHOLDER',
    conditions: [
      'Keseleo pergelangan kaki (ankle sprain)',
      'Kram atau tarikan otot betis (strain)',
      'Cedera ligamen lutut (ACL)',
      'Nyeri sendi akibat beban aktivitas',
    ],
    benefits: [
      'Program latihan progresif yang terstruktur',
      'Pendampingan kembali ke aktivitas olahraga',
      'Evaluasi perkembangan secara berkala',
    ],
  },
  {
    id: 'nyeri-punggung-leher',
    title: 'Nyeri Punggung & Leher',
    description:
      'Penanganan nyeri punggung bawah, nyeri leher, dan ketidaknyamanan akibat postur atau aktivitas sehari-hari.',
    icon: Stethoscope,
    image: '/images/models/model-patient-3.png',
    backgroundImage: '/images/backgrounds/bg-hf-2.png',
    gradient: 'from-teal-700/90 to-teal-600/70',
    status: 'PLACEHOLDER',
    conditions: [
      'Nyeri punggung bawah (low back pain)',
      'Nyeri leher dan bahu karena postur',
      'Kekakuan setelah duduk lama',
      'Keluhan akibat aktivitas kerja berulang',
    ],
    benefits: [
      'Pola gerak dikoreksi sesuai keluhan',
      'Latihan penguatan inti dan peregangan',
      'Edukasi postur untuk aktivitas sehari-hari',
    ],
  },
  {
    id: 'rehabilitasi-pasca-operasi',
    title: 'Rehabilitasi Pasca Operasi',
    description: 'Program pemulihan terstruktur setelah operasi ortopedi untuk mengembalikan fungsi dan kekuatan.',
    icon: Heart,
    image: '/images/models/model-patient-4.png',
    backgroundImage: '/images/backgrounds/bg-hf-3.png',
    gradient: 'from-emerald-700/90 to-emerald-600/70',
    status: 'PLACEHOLDER',
    conditions: [
      'Rehabilitasi pasca operasi lutut',
      'Pemulihan pasca operasi bahu',
      'Operasi penggantian sendi',
      'Mengembalikan rentang gerak dan kekuatan',
    ],
    benefits: [
      'Tahapan pemulihan yang bertahap dan aman',
      'Monitoring perkembangan fungsi sendi',
      'Koordinasi dengan tim perawatan Anda',
    ],
  },
  {
    id: 'kesehatan-sendi-otot',
    title: 'Kesehatan Sendi & Otot',
    description: 'Penanganan keluhan sendi, encok, dan masalah muskuloskeletal lainnya.',
    icon: Footprints,
    image: '/images/models/model-patient-5.png',
    backgroundImage: '/images/backgrounds/bg-hf-4.png',
    gradient: 'from-slate-700/90 to-slate-600/70',
    status: 'PLACEHOLDER',
    conditions: [
      'Nyeri sendi lutut dan pinggang',
      'Keluhan otot kaku atau tegang',
      'Masalah muskuloskeletal umum',
      'Keseimbangan dan gaya berjalan',
    ],
    benefits: [
      'Pendekatan menyeluruh pada sendi dan otot',
      'Program yang disesuaikan keluhan Anda',
      'Latihan untuk menjaga kualitas gerak',
    ],
  },
];
