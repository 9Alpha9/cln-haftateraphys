'use client';

import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { MapPin, Phone, Clock, MessageCircle, Navigation } from 'lucide-react';

export function ContactSection() {
  return (
    <Section id="kontak" className="bg-white">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
              Lokasi &amp; Kontak
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] md:text-3xl">
              Hubungi Kami
            </h2>
            <p className="mt-3 text-stone-600">
              Kami siap membantu Anda memulai perjalanan pemulihan fisik yang nyaman dan aman
            </p>
          </div>
        </ScrollAnimation>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <ScrollAnimation delay={0} className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_8px_30px_rgb(24,23,0,0.04)]">
              <div className="relative aspect-[16/9] w-full lg:aspect-[21/9]">
                <iframe
                  src="https://www.google.com/maps?q=-7.4613804,112.708499&z=17&output=embed"
                  title="Lokasi Hafta Fisioterapi Sidoarjo di Google Maps"
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--hafta-ylw-950)]" />
                  <span className="text-sm font-medium text-stone-700">Sidoarjo, Jawa Timur</span>
                </div>
                <a
                  href="https://maps.app.goo.gl/rtobQBMKrAMkcqxF7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 bg-[var(--hafta-ylw-100)] px-3 text-xs font-bold text-[var(--hafta-ylw-950)] transition-colors hover:bg-[var(--hafta-ylw-200)]"
                >
                  <Navigation className="h-3 w-3" />
                  Buka di Maps
                </a>
              </div>
            </div>
          </ScrollAnimation>

          <div className="flex flex-col gap-4">
            <ScrollAnimation delay={0.1}>
              <div className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_8px_30px_rgb(24,23,0,0.03)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-sm">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--hafta-ylw-950)]">Telepon &amp; WhatsApp</h3>
                    <p className="mt-1 text-sm text-stone-600">0812-3293-2872</p>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation delay={0.2}>
              <div className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_8px_30px_rgb(24,23,0,0.03)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--hafta-ylw-950)]">Jam Pelayanan</h3>
                    <div className="mt-1 flex flex-col text-sm text-stone-600">
                      <span>Senin - Sabtu: 08.00 - 20.00 WIB</span>
                      <span>Minggu &amp; Libur: 08.00 - 13.00 WIB</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation delay={0.3}>
              <a
                href="https://wa.me/6281232932872"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-5 py-4 text-sm font-bold text-[var(--hafta-ylw-950)] shadow-sm transition-colors hover:bg-[var(--hafta-ylw-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-100)]"
              >
                <MessageCircle className="h-5 w-5" />
                Konsultasi via WhatsApp
              </a>
            </ScrollAnimation>
          </div>
        </div>
      </Container>
    </Section>
  );
}
