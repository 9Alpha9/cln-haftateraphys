'use client';

import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { MapPin, Clock, Shield, Users } from 'lucide-react';

const trustItems = [
  {
    icon: MapPin,
    title: 'Lokasi Strategis',
    description: 'Terletak di Sidoarjo, mudah diakses dari berbagai area',
  },
  {
    icon: Clock,
    title: 'Jadwal Fleksibel',
    description: 'Menyesuaikan dengan waktu pasien untuk kenyamanan terapi',
  },
  {
    icon: Shield,
    title: 'Pendekatan Berbasis Bukti',
    description: 'Program terapi mengikuti standar evidence-based practice',
  },
  {
    icon: Users,
    title: 'Tim Profesional',
    description: 'Ditangani oleh fisioterapis bersertifikat dan berpengalaman',
  },
];

export function TrustContext() {
  return (
    <div className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 sm:-mt-20 sm:px-6 lg:-mt-24 lg:px-8">
      <ScrollAnimation>
        <div className="grid grid-cols-1 divide-y divide-stone-100 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(24,23,0,0.08)] sm:grid-cols-2 sm:gap-6 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:gap-0 lg:p-8">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-start gap-4 pt-4 first:pt-0 sm:pt-0 lg:px-5 lg:first:pl-0 lg:last:pr-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--hafta-ylw-950)] text-[var(--hafta-ylw-100)] sm:h-12 sm:w-12 sm:rounded-xl">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--hafta-ylw-950)]">{item.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollAnimation>
    </div>
  );
}
