'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { services } from '@/components/landing/services-data';
import { ArrowRight } from 'lucide-react';

export function ServicesSection() {
  return (
    <Section id="layanan" className="bg-white">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Layanan Kami</h2>
            <p className="mt-3 text-muted-foreground">
              Berbagai kondisi yang dapat ditangani dengan pendampingan fisioterapi profesional
            </p>
          </div>
        </ScrollAnimation>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <ScrollAnimation key={service.id} delay={index * 0.1}>
              <div
                className={`group relative min-h-[360px] overflow-hidden rounded-2xl bg-gradient-to-b ${service.gradient}`}
              >
                <div className="absolute inset-x-0 top-0 h-[58%]">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain object-center transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="relative flex min-h-[360px] flex-col justify-end p-5">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/80">{service.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-sm font-medium text-white">
                    <Link
                      href={`/layanan/${service.id}`}
                      className="inline-flex items-center gap-1 text-white underline-offset-4 hover:underline"
                    >
                      Selengkapnya
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>

        <ScrollAnimation delay={0.4}>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Tidak yakin dengan kondisi Anda?{' '}
              <a href="https://wa.me/6281232932872" className="font-medium text-primary hover:underline">
                Konsultasikan dengan kami
              </a>
            </p>
          </div>
        </ScrollAnimation>
      </Container>
    </Section>
  );
}
