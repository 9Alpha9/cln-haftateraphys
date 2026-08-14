import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { PublicHeader } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ContactSection } from '@/components/landing/contact-section';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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
        <section className="relative isolate overflow-hidden bg-emerald-900 text-white">
          <Image
            src={service.backgroundImage}
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
            <Breadcrumb
              className="pt-6"
              items={[
                { label: 'Beranda', href: '/' },
                { label: 'Layanan', href: '/layanan' },
                { label: service.title },
              ]}
            />

            <div className="py-12 md:py-16 lg:py-20">
              <div className="max-w-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-emerald-950/35 backdrop-blur-sm">
                  <service.icon className="h-5 w-5" />
                </div>
                <h1 className="mt-5 text-[28px] font-bold leading-9 tracking-tight md:text-4xl md:leading-[44px]">
                  {service.title}
                </h1>
                <p className="mt-4 text-base leading-[26px] text-white/95 md:text-lg md:leading-[30px]">
                  {service.description}
                </p>
                <a
                  href="https://wa.me/6281232932872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-sage-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900"
                >
                  Konsultasikan kondisi ini
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Container>
        </section>

        <Section className="bg-white">
          <Container>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Kondisi yang dapat ditangani</h2>
                <ul className="mt-5 space-y-3">
                  {service.conditions.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Pendekatan kami</h2>
                <ul className="mt-5 space-y-3">
                  {service.benefits.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </Section>

        {related.length > 0 && (
          <Section className="bg-surface">
            <Container>
              <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Layanan lainnya</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/layanan/${item.id}`}
                    className="group rounded-2xl border border-border bg-white p-5 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Lihat layanan
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </Container>
          </Section>
        )}

        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
