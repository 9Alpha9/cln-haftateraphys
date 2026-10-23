import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { PublicHeader } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { NotchedCard, type NotchedCardVariant } from '@/components/ui/notched-card';
import { ContactSection } from '@/components/landing/contact-section';
import { services } from '@/components/landing/services-data';
import { Check, ArrowRight } from 'lucide-react';

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.id }));
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.id === slug);

  if (!service) return { title: 'Layanan — Hafta Fisioterapi' };

  return {
    title: `${service.title} — Hafta Fisioterapi`,
    description: service.description,
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = services.find((s) => s.id === slug);

  if (!service) notFound();

  const related = services.filter((s) => s.id !== service.id).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section Detail Layanan */}
        <section className="relative isolate min-h-[480px] overflow-hidden bg-[var(--hafta-ylw-950)] pb-16 pt-8 text-white md:pb-24 lg:pb-28">
          <Image
            src={service.backgroundImage}
            alt=""
            fill
            sizes="100vw"
            className="-z-20 object-cover object-[center_20%] lg:object-[center_15%]"
            quality={100}
            priority
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-[#181700]/95 via-[#181700]/75 to-[#181700]/40 lg:bg-gradient-to-r lg:from-[#181700]/90 lg:via-[#181700]/65 lg:to-transparent"
          />
          <Container>
            <div className="py-12 md:py-16 lg:py-20">
              <ScrollReveal direction="left" className="max-w-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-[var(--hafta-ylw-100)] backdrop-blur-sm shadow-sm">
                  <service.icon className="h-5 w-5" />
                </div>
                <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {service.title}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-stone-200 sm:text-lg">
                  {service.description}
                </p>
                <a
                  href="https://wa.me/6281232932872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-6 text-sm font-bold text-[var(--hafta-ylw-950)] shadow-sm transition-colors hover:bg-[var(--hafta-ylw-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-100)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181700]"
                >
                  Konsultasikan Kondisi Ini
                  <ArrowRight className="h-4 w-4" />
                </a>
              </ScrollReveal>
            </div>
          </Container>
        </section>

        {/* Detail Kondisi & Pendekatan */}
        <Section className="bg-white py-16 md:py-20">
          <Container>
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                  Keluhan Pasien
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                  Keluhan yang Sering Kami Bantu
                </h2>
                <ul className="mt-6 space-y-3">
                  {service.conditions.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-4 text-sm text-stone-700 shadow-xs"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)]">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                  Pendampingan
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                  Cara Kami Mendampingi Anda
                </h2>
                <ul className="mt-6 space-y-3">
                  {service.benefits.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-4 text-sm text-stone-700 shadow-xs"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)]">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </Section>

        {/* Layanan Terkait */}
        {related.length > 0 && (
          <Section className="border-t border-stone-200/60 bg-[#FEFEF6] py-16 md:py-20">
            <Container>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                Eksplorasi Layanan
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                Layanan Fisioterapi Lainnya
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item, idx) => {
                  const variants: NotchedCardVariant[] = ['white', 'accent', 'dark'];
                  const variant = variants[idx % variants.length];

                  return (
                    <ScrollReveal key={item.id} delay={idx * 0.08} className="h-full">
                      <NotchedCard
                        variant={variant}
                        icon={<item.icon className="h-6 w-6" />}
                        title={item.title}
                        description={item.description}
                        href={`/layanan/${item.id}`}
                        buttonText="Lihat Layanan"
                        showRings={variant === 'accent' || variant === 'dark'}
                        className="h-full min-h-[280px]"
                      />
                    </ScrollReveal>
                  );
                })}
              </div>
            </Container>
          </Section>
        )}

        {/* Section Kontak */}
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
