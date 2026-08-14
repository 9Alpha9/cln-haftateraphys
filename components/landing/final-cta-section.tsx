'use client';

import Link from 'next/link';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { ArrowRight, LogIn } from 'lucide-react';

export function FinalCtaSection() {
  return (
    <Section className="bg-primary text-primary-foreground">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Mulai langkah pemulihan bersama Hafta</h2>
            <p className="mt-3 text-primary-foreground/80">
              Konsultasikan kondisi Anda dan mulai program pemulihan yang tepat
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="https://wa.me/6281232932872"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-medium text-primary transition-colors hover:bg-white/90"
              >
                Buat Janji Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/30 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
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
