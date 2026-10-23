'use client';

import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { NotchedCard, type NotchedCardVariant } from '@/components/ui/notched-card';
import { services } from '@/components/landing/services-data';

const cardVariants: NotchedCardVariant[] = ['white', 'accent', 'dark', 'white'];

export function ServicesSection() {
  return (
    <Section id="layanan" className="bg-white pt-20 lg:pt-28">
      <Container>
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
              Layanan Spesialis
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] md:text-3xl">
              Layanan Kami
            </h2>
            <p className="mt-3 text-stone-600">
              Berbagai kondisi fisik dan muskuloskeletal yang ditangani melalui protokol fisioterapi teruji
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const variant = cardVariants[index % cardVariants.length];
            return (
              <ScrollReveal key={service.id} delay={index * 0.1} className="h-full">
                <NotchedCard
                  variant={variant}
                  icon={service.icon}
                  title={service.title}
                  description={service.description}
                  href={`/layanan/${service.id}`}
                  buttonText="Lihat Detail"
                  showRings={variant === 'accent' || variant === 'dark'}
                  className="h-full min-h-[320px]"
                />
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={0.4}>
          <div className="mt-10 text-center">
            <p className="text-sm text-stone-600">
              Tidak yakin dengan kondisi keluhan Anda?{' '}
              <a
                href="https://wa.me/6281232932872"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--hafta-ylw-950)] underline decoration-[var(--hafta-ylw-200)] decoration-2 underline-offset-4 hover:decoration-[var(--hafta-ylw-100)]"
              >
                Konsultasikan langsung dengan kami via WhatsApp
              </a>
            </p>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
