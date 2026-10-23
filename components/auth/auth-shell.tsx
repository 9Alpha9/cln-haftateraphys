'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

const slides = [
  {
    image: '/images/backgrounds/bg-hf-10.png',
    title: 'Hafta Fisioterapi',
    description:
      'Klinik fisioterapi profesional untuk pemulihan optimal, terukur, dan nyaman di Sidoarjo.',
  },
  {
    image: '/images/backgrounds/bg-hf-11.png',
    title: 'Patient Portal Digital Terintegrasi',
    description:
      'Pantau riwayat kunjungan, catatan evaluasi terapis, dan program latihan mandiri langsung dari ponsel Anda.',
  },
  {
    image: '/images/backgrounds/bg-hf-2.png',
    title: 'Kenyamanan Terapi 1-on-1 Privat',
    description:
      'Sesi tatap muka yang tenang, higienis, dan terfokus penuh untuk hasil pemulihan fisik yang optimal.',
  },
  {
    image: '/images/backgrounds/bg-hf-4.png',
    title: 'Mitra Kesehatan Sendi & Otot Sidoarjo',
    description:
      'Didukung pendekatan berbasis bukti ilmiah untuk membantu Anda kembali aktif berkarya dan berolahraga.',
  },
];

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  const currentSlide = slides[activeSlide];

  return (
    <div className="relative min-h-screen bg-[#FEFEF6] sm:bg-white">
      {/* ── PANEL KIRI: IMAGE SLIDER (DESKTOP ONLY) ── */}
      <aside className="fixed inset-y-0 left-0 z-0 hidden w-1/2 overflow-hidden bg-[#181700] lg:block">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentSlide.image}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <Image
              src={currentSlide.image}
              alt={currentSlide.title}
              fill
              sizes="50vw"
              className="pointer-events-none object-cover object-[center_20%]"
              quality={100}
              priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Warm Charcoal Gradient (#181700) — Foto Jernih Alami Tanpa Kabut Hijau */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#181700]/95 via-[#181700]/45 to-[#181700]/15" />

        {/* Konten Di Atas Slider */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          {/* Logo Hafta di Atas */}
          <Link href="/" className="inline-block transition-opacity hover:opacity-90">
            <Image
              src="/images/logos/logos-text.png"
              alt="Hafta Fisioterapi"
              width={160}
              height={106}
              className="h-14 w-auto brightness-0 invert"
              priority
            />
          </Link>

          {/* Bagian Bawah: Teks Slider Humanize & Indikator */}
          <div className="max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: reduceMotion ? 0 : 0.4 }}
              >
                <h2 className="text-2xl font-bold leading-tight text-white xl:text-3xl">
                  {currentSlide.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-200">
                  {currentSlide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Indikator Slide Aktif (Kuning Hafta #f7f000) vs Inaktif */}
            <div className="mt-6 flex items-center gap-2" aria-label="Navigasi slide">
              {slides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Pindah ke slide ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    index === activeSlide
                      ? 'w-8 bg-[var(--hafta-ylw-100)] shadow-xs'
                      : 'w-2.5 bg-white/35 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── PANEL KANAN: FORM KONTEN ── */}
      <div className="relative z-10 flex min-h-screen flex-col justify-center px-5 py-8 sm:px-8 lg:ml-[50%] lg:w-1/2 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Baris Paling Atas: Navigasi Balik ke Beranda */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-[#181700] sm:mb-8"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </Link>

          {/* Form Wrapper: Card putih bersih di mobile, seamless di desktop */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
