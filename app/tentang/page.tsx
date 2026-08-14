import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock3, MapPin, MessageCircle, Stethoscope } from 'lucide-react';
import { Container } from '@/components/container';
import { Footer } from '@/components/landing/footer';
import { InstagramCarousel } from '@/components/landing/instagram-carousel';
import { PublicHeader } from '@/components/landing/navbar';
import { Section } from '@/components/section';

export const metadata: Metadata = {
  title: 'Tentang Kami — Hafta Fisioterapi',
  description:
    'Hafta Fisioterapi adalah layanan fisioterapi di Sidoarjo dengan layanan rehabilitasi, home visit, dan on field.',
};

const services = ['General Physiotherapy', 'Rehabilitasi', 'Home Visit', 'On Field'];

const instagramImages = [
  '/images/instagram/thumbnails-hf-1.jpg',
  '/images/instagram/thumbnails-hf-2.jpg',
  '/images/instagram/thumbnails-hf-3.jpg',
  '/images/instagram/thumbnails-hf-4.jpg',
  '/images/instagram/thumbnails-hf-5.jpg',
  '/images/instagram/thumbnails-hf-7.jpg',
  '/images/instagram/thumbnails-hf-8.jpg',
  '/images/instagram/thumbnails-hf-16.jpg',
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-emerald-900 text-white">
          <Image
            src="/images/backgrounds/bg-hf-11.png"
            alt=""
            fill
            sizes="100vw"
            priority
            className="-z-20 object-cover object-center"
            quality={100}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-950/95 via-emerald-900/85 to-emerald-950/40" />
          <Container>
            <div className="max-w-2xl py-16 md:py-24">
              <p className="text-sm font-semibold text-sage-200">Tentang Kami</p>
              <h1 className="mt-3 text-[34px] font-bold leading-10 tracking-tight md:text-[44px] md:leading-[52px]">
                Layanan fisioterapi untuk mendukung gerak Anda.
              </h1>
              <p className="mt-5 text-base leading-[26px] text-white/95 md:text-lg md:leading-[30px]">
                Hafta Fisioterapi menyediakan layanan fisioterapi di Sidoarjo, termasuk rehabilitasi, home visit, dan
                layanan on field.
              </p>
              <a
                href="https://wa.me/6281232932872"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-sage-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900"
              >
                Hubungi via WhatsApp
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Container>
        </section>

        <Section className="bg-white">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
              <div>
                <p className="text-sm font-semibold text-primary">Hafta Fisioterapi Sidoarjo</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Pendampingan fisioterapi yang dekat dengan kebutuhan Anda
                </h2>
                <p className="mt-5 text-base leading-[26px] text-muted-foreground">
                  Kami melayani kebutuhan fisioterapi umum dan rehabilitasi. Untuk kenyamanan dan kebutuhan layanan
                  tertentu, Hafta Fisioterapi juga menyediakan home visit serta on field.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {services.map((service) => (
                    <div
                      key={service}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-sm font-semibold text-foreground"
                    >
                      <Stethoscope className="h-5 w-5 shrink-0 text-primary" />
                      {service}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
                <Image
                  src="/images/backgrounds/bg-hf-10.png"
                  alt="Layanan Hafta Fisioterapi"
                  width={1920}
                  height={1080}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="h-auto w-full object-cover"
                  quality={100}
                />
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-surface">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Informasi layanan</h2>
              <p className="mt-3 text-muted-foreground">
                Informasi berikut bersumber dari profil dan tautan resmi Hafta Fisioterapi.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-white p-6">
                <MapPin className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-semibold text-foreground">Lokasi</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Sidoarjo, Jawa Timur</p>
                <a
                  href="https://maps.app.goo.gl/rtobQBMKrAMkcqxF7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
                >
                  Buka lokasi
                </a>
              </div>
              <div className="rounded-xl border border-border bg-white p-6">
                <Clock3 className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-semibold text-foreground">Jam operasional</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Hubungi kami melalui WhatsApp untuk informasi jadwal layanan.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-white p-6">
                <MessageCircle className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-semibold text-foreground">Hubungi kami</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">WhatsApp: 0812-3293-2872</p>
                <a
                  href="https://wa.me/6281232932872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
                >
                  Kirim pesan
                </a>
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-white">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-primary">Instagram</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Ikuti aktivitas Hafta Fisioterapi
              </h2>
              <p className="mt-3 text-muted-foreground">Lihat pembaruan dan edukasi terbaru dari Instagram kami.</p>
            </div>
            <InstagramCarousel images={instagramImages} />
          </Container>
        </Section>

        <Section className="bg-white">
          <Container className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Siap memulai konsultasi?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Hubungi Hafta Fisioterapi untuk informasi layanan dan konsultasi awal.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="https://wa.me/6281232932872"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Hubungi via WhatsApp
                <MessageCircle className="h-4 w-4" />
              </a>
              <Link
                href="/layanan"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
              >
                Lihat layanan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
