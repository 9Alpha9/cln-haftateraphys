'use client';

import Link from 'next/link';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { ArrowRight, LogIn } from 'lucide-react';

export function FinalCtaSection() {
  return (
    <Section className="relative isolate overflow-hidden bg-[var(--hafta-ylw-950)] text-white py-16 md:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-[600px] -translate-x-1/2 rounded-full bg-[var(--hafta-ylw-100)]/10 blur-3xl"
      />

      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-100)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
              Mulai Pemulihan
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
              Mulai langkah pemulihan Anda bersama{' '}
              <span className="text-[var(--hafta-ylw-100)]">Hafta Fisioterapi</span>
            </h2>
            <p className="mt-4 text-base text-stone-300 leading-relaxed">
              Konsultasikan keluhan gerak Anda dengan tim fisioterapis kami dan dapatkan program
              pemulihan yang terstruktur, aman, dan terpantau.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="https://wa.me/6281232932872"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-7 text-sm font-bold text-[var(--hafta-ylw-950)] shadow-lg shadow-[var(--hafta-ylw-100)]/15 transition-colors hover:bg-[var(--hafta-ylw-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-100)]"
              >
                Buat Janji Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <LogIn className="h-4 w-4" />
                Masuk Patient Portal
              </Link>
            </div>
          </div>
        </ScrollAnimation>
      </Container>
    </Section>
  );
}
