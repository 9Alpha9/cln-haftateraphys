'use client';

import Image from 'next/image';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { services } from '@/components/landing/services-data';
import { Check, ArrowRight } from 'lucide-react';

export function ServicesDetailSection() {
  return (
    <Section className="bg-white">
      <Container>
        <div className="space-y-16 lg:space-y-20">
          {services.map((service, index) => {
            const reversed = index % 2 === 1;

            return (
              <ScrollAnimation key={service.id} delay={0.05}>
                <div id={service.id} className="grid scroll-mt-24 items-center gap-8 lg:grid-cols-2 lg:gap-12">
                  <div
                    className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br ${service.gradient} ${
                      reversed ? 'lg:order-2' : ''
                    }`}
                  >
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain object-bottom"
                      loading="lazy"
                    />
                    <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <service.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="absolute bottom-5 right-5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {service.status === 'PLACEHOLDER' ? 'Informasi awal' : 'Dikonfirmasi'}
                    </span>
                  </div>

                  <div className={reversed ? 'lg:order-1' : ''}>
                    <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{service.title}</h2>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{service.description}</p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Kondisi yang ditangani</h3>
                        <ul className="mt-3 space-y-2">
                          {service.conditions.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Pendekatan kami</h3>
                        <ul className="mt-3 space-y-2">
                          {service.benefits.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <a
                      href={`/layanan/${service.id}`}
                      className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                    >
                      Lihat detail layanan
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </ScrollAnimation>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
