'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { ArrowRight, LogIn } from 'lucide-react';

export function HeroSection() {
  return (
    <Section className="relative isolate overflow-hidden bg-emerald-900 py-16 text-white md:py-24 lg:py-28">
      <Image
        src="/images/backgrounds/bg-hf-11.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center"
        quality={100}
        priority
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-950/95 via-emerald-900/85 to-emerald-950/35"
      />
      <Container>
        <ScrollAnimation direction="left">
          <div className="max-w-xl">
            <h1 className="text-[34px] font-bold leading-10 tracking-tight md:text-[44px] md:leading-[52px]">
              Kembali bergerak dengan lebih percaya diri
            </h1>
            <p className="my-10 text-base leading-[26px] text-white/95 md:text-lg md:leading-[30px]">
              Pendampingan fisioterapi yang terstruktur untuk membantu memahami kondisi, menjalani program pemulihan,
              dan memantau perkembangan terapi.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="https://wa.me/6281232932872"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-sage-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900"
              >
                Buat Janji
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/70 bg-emerald-950/35 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-950/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900"
              >
                <LogIn className="h-4 w-4" />
                Masuk Patient Portal
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/95">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-sage-200" />
                <span>Terstruktur & profesional</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-sage-200" />
                <span>Berbasis bukti</span>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </Container>
    </Section>
  );
}
