'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/container';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { ArrowRight, LogIn } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[640px] overflow-hidden bg-[var(--hafta-ylw-950)] pb-28 pt-16 text-white lg:min-h-[720px] lg:pb-36 lg:pt-24">
      <Image
        src="/images/backgrounds/bg-hf-11.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[center_20%] lg:object-[center_15%]"
        quality={75}
        priority
        fetchPriority="high"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[#181700] via-[#181700]/85 to-[#181700]/50 lg:bg-gradient-to-r lg:from-[#181700]/90 lg:via-[#181700]/65 lg:to-transparent"
      />
      <Container>
        <ScrollAnimation direction="left">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <span className="h-0.5 w-8 bg-[var(--hafta-ylw-100)] shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium tracking-wide text-white/90">
                Fisioterapi Profesional di Sidoarjo
              </span>
            </div>

            <h1 className="mt-4 text-[28px] font-bold leading-[1.2] tracking-tight sm:text-4xl sm:leading-[1.15] lg:text-5xl">
              Kembali bergerak dengan{' '}
              <span className="text-[var(--hafta-ylw-100)]">lebih percaya diri</span>
            </h1>

            <p className="my-6 text-sm leading-relaxed text-white/85 sm:text-base">
              Pendampingan fisioterapi yang terstruktur untuk membantu memahami kondisi, menjalani
              program pemulihan, dan memantau perkembangan terapi Anda secara terarah.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="https://wa.me/6281232932872"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-5 py-3 text-sm font-bold text-[var(--hafta-ylw-950)] shadow-sm transition-colors hover:bg-[var(--hafta-ylw-200)] sm:px-6 sm:py-3.5 sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-100)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181700]"
              >
                Buat Janji
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-6 sm:py-3.5 sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#181700]"
              >
                <LogIn className="h-4 w-4" />
                Masuk Patient Portal
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-stone-300">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[var(--hafta-ylw-100)]" />
                <span>Terstruktur &amp; profesional</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[var(--hafta-ylw-100)]" />
                <span>Berbasis bukti ilmiah</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[var(--hafta-ylw-100)]" />
                <span>Patient Portal digital</span>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </Container>
    </section>
  );
}
