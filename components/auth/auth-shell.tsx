'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

const slides = [
  {
    image: '/images/backgrounds/bg-hf-10.png',
    alt: 'Fisioterapis Hafta mendampingi pasien berlatih berjalan dengan alat bantu',
    title: 'Pemulihan yang terukur, bukan tebak-tebakan',
    description:
      'Setiap sesi dimulai dengan asesmen dan dievaluasi ulang. Anda tahu persis kemajuan gerak dan nyeri Anda.',
  },
  {
    image: '/images/backgrounds/bg-hf-11.png',
    alt: 'Terapis Hafta mendampingi pasien berlatih gerakan pemulihan',
    title: 'Terapis mendampingi, bukan sekadar menyarankan',
    description:
      'Terapi 1-on-1 dengan fisioterapis yang sama, sehingga program latihan Anda nyambung dari kunjungan ke kunjungan.',
  },
  {
    image: '/images/backgrounds/bg-hf-2.png',
    alt: 'Suasana ruang terapi Hafta Fisioterapi',
    title: 'Akses lengkap ke catatan terapi Anda',
    description:
      'Riwayat kunjungan, catatan evaluasi, dan program latihan mandiri tersimpan rapi di satu tempat.',
  },
];

const SLIDE_DURATION_MS = 6500;

interface AuthShellProps {
  children: ReactNode;
  /** Penanda halaman untuk menyesuaikan label kembali. */
  backHref?: string;
  backLabel?: string;
}

export function AuthShell({
  children,
  backHref = '/',
  backLabel = 'Kembali ke Beranda',
}: AuthShellProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  // Pause otomatis saat pengguna memilih slide atau mengaktifkan reduced motion.
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || isPaused) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [reduceMotion, isPaused]);

  const currentSlide = slides[activeSlide];

  return (
    <div className="relative min-h-dvh bg-[var(--hafta-950)] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* ── PANEL KIRI: SUASANA KLINIK (≥ lg, stretch penuh tinggi viewport) ── */}
      <aside className="relative hidden overflow-hidden bg-[var(--hafta-950)] lg:sticky lg:top-0 lg:block lg:h-dvh">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={currentSlide.image}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={currentSlide.image}
              alt={currentSlide.alt}
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="pointer-events-none object-cover object-center"
              quality={100}
              priority={activeSlide === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Warm charcoal scrim — foto tetap jernih, teks tetap kontras. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--hafta-950)] via-[var(--hafta-950)]/55 to-[var(--hafta-950)]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,transparent_35%,var(--hafta-950)_130%)] opacity-70" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <Link
            href="/"
            tabIndex={-1}
            aria-hidden="true"
            className="inline-block w-fit rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            <Image
              src="/images/logos/logos-text.png"
              alt=""
              width={160}
              height={106}
              className="h-14 w-auto brightness-0 invert"
              priority
            />
          </Link>

          <div className="max-w-lg">
            {/* Bukti sosial konkret — bukan testimoni karangan. */}
            <ul className="mb-8 space-y-2.5 text-xs font-medium text-stone-200 xl:text-sm">
              {[
                'Asesmen awal dan target pemulihan sejak kunjungan pertama',
                'Terapis tetap untuk tiap program, tidak berganti tiap sesi',
                'Data Anda disimpan aman dan tidak dibagikan',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-org-300)]/20 text-[var(--hafta-org-200)]">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <AnimatePresence mode="wait">
              <motion.figure
                key={currentSlide.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.2, 0, 0, 1] }}
              >
                <blockquote className="text-balance text-2xl font-bold leading-snug text-white xl:text-[1.75rem]">
                  {currentSlide.title}
                </blockquote>
                <figcaption className="mt-2.5 max-w-md text-sm leading-relaxed text-stone-300">
                  {currentSlide.description}
                </figcaption>
              </motion.figure>
            </AnimatePresence>

            <div className="mt-7 flex items-center gap-1.5" role="group" aria-label="Pilih tampilan foto">
              {slides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  onClick={() => {
                    setActiveSlide(index);
                    setIsPaused(true);
                  }}
                  tabIndex={-1}
                  aria-label={`Tampilkan foto: ${slide.title}`}
                  aria-current={index === activeSlide ? 'true' : undefined}
                  className="group flex h-8 w-6 cursor-pointer items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <span
                    className={
                      index === activeSlide
                        ? 'block h-1 w-6 rounded-full bg-[var(--hafta-org-200)]'
                        : 'block h-1 w-4 rounded-full bg-white/35 transition-colors group-hover:bg-white/65'
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── PANEL KANAN: FORM ── */}
      <div className="relative flex min-h-dvh flex-col bg-[var(--background)] lg:bg-white">
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-4 pb-8 pt-4 sm:px-8 sm:pt-8 lg:justify-center lg:px-6 lg:pb-14 lg:pt-10">
          <nav className="mb-3 sm:mb-5">
            <Link
              href={backHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-2 text-xs font-medium text-stone-600 transition-colors hover:text-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/40 sm:text-sm"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              <span>{backLabel}</span>
            </Link>
          </nav>

          <main className="flex-1 rounded-2xl border border-stone-200/90 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(24,23,0,0.04)] sm:rounded-3xl sm:px-7 sm:py-8 lg:flex-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            {/* Logo hanya di mobile/tablet; di desktop sudah ada di panel kiri. */}
            <div className="mb-6 lg:hidden">
              <Link href="/" className="inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/40">
                <Image
                  src="/images/logos/logos-text.png"
                  alt="Hafta Fisioterapi"
                  width={140}
                  height={93}
                  priority
                  className="h-11 w-auto sm:h-12"
                />
              </Link>
            </div>
            {children}
          </main>

          <footer className="mt-6 text-center text-[11px] leading-relaxed text-stone-500 lg:mt-10">
            <p>
              &copy; {new Date().getFullYear()} Hafta Fisioterapi &middot; Sidoarjo, Jawa Timur
            </p>
            <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <Link
                href="/privacy"
                className="rounded underline-offset-2 hover:text-[var(--hafta-950)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
              >
                Kebijakan Privasi
              </Link>
              <span aria-hidden="true">&middot;</span>
              <Link
                href="/terms"
                className="rounded underline-offset-2 hover:text-[var(--hafta-950)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
              >
                Syarat &amp; Ketentuan
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
