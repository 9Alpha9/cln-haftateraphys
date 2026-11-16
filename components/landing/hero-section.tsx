'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/container';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { ArrowRight, LogIn } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[640px] overflow-hidden bg-[var(--hafta-org-950)] pb-28 pt-16 text-white lg:min-h-[720px] lg:pb-36 lg:pt-24">
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
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--hafta-950)] via-[var(--hafta-950)]/85 to-[var(--hafta-950)]/50 lg:bg-gradient-to-r lg:from-[var(--hafta-950)]/90 lg:via-[var(--hafta-950)]/65 lg:to-transparent"
      />
      <Container>
        <ScrollAnimation direction="left">
          <div className="max-w-xl">
            <p className="text-sm font-medium tracking-wide text-white/90">
              Fisioterapi Profesional di Sidoarjo
            </p>

            <h1 className="mt-4 text-[28px] font-bold leading-[1.2] tracking-tight sm:text-4xl sm:leading-[1.15] lg:text-5xl">
              Kembali bergerak dengan{' '}
              <span className="text-[var(--hafta-300)]">lebih percaya diri</span>
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
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--hafta-300)] px-4 sm:px-5 py-3 text-sm font-bold text-[var(--hafta-org-950)] transition-colors hover:bg-[var(--hafta-400)] sm:px-6 sm:py-3.5 sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hafta-950)]"
              >
                Buat Janji
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 sm:px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-6 sm:py-3.5 sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hafta-950)]"
              >
                <LogIn className="h-4 w-4" />
                Masuk Patient Portal
              </Link>
            </div>

            <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-300 sm:text-sm">
              <span>Terstruktur &amp; profesional</span>
              <span>Berbasis bukti ilmiah</span>
              <span>Patient Portal digital</span>
            </p>
          </div>
        </ScrollAnimation>
      </Container>
    </section>
  );
}
