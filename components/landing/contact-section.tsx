'use client';

import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { MapPin, Phone, Clock, MessageCircle, Navigation } from 'lucide-react';

export function ContactSection() {
  return (
    <Section id="kontak" className="bg-surface">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Hubungi Kami</h2>
            <p className="mt-3 text-muted-foreground">Kami siap membantu Anda memulai perjalanan pemulihan</p>
          </div>
        </ScrollAnimation>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <ScrollAnimation delay={0} className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
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
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Sidoarjo, Jawa Timur</span>
                </div>
                <a
                  href="https://maps.app.goo.gl/rtobQBMKrAMkcqxF7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Navigation className="h-3 w-3" />
                  Buka di Maps
                </a>
              </div>
            </div>
          </ScrollAnimation>

          <div className="flex flex-col gap-4">
            <ScrollAnimation delay={0.1}>
              <div className="rounded-xl border border-border bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Telepon</h3>
                    <p className="mt-1 text-sm text-muted-foreground">WhatsApp: 0812-3293-2872</p>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation delay={0.2}>
              <div className="rounded-xl border border-border bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Jam Operasional</h3>
                    <div className="mt-1 text-sm text-muted-foreground flex flex-col">
                      <span>Senin-Sabtu: 08.00-20.00</span>
                      <span>Minggu & Hari Libur: 08.00-13.00</span>
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
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-4 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <MessageCircle className="h-5 w-5" />
                Hubungi via WhatsApp
              </a>
            </ScrollAnimation>
          </div>
        </div>
      </Container>
    </Section>
  );
}
