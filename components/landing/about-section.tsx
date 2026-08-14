'use client';

import Image from 'next/image';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { Target, Heart, Shield } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Fokus pada Hasil',
    description: 'Program terapi dirancang untuk mencapai目标 pemulihan yang terukur',
  },
  {
    icon: Heart,
    title: 'Pendekatan Holistik',
    description: 'Tidak hanya menangani gejala, tetapi memahami akar masalah',
  },
  {
    icon: Shield,
    title: 'Standar Profesional',
    description: 'Mengikuti protokol evidance-based practice dalam setiap sesi',
  },
];

export function AboutSection() {
  return (
    <Section id="tentang" className="bg-surface">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          <ScrollAnimation direction="left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Tentang Hafta Fisioterapi
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Hafta Fisioterapi hadir untuk memberikan layanan fisioterapi yang profesional dan terjangkau. Kami
                percaya setiap pasien berhak mendapatkan program pemulihan yang tepat dan terstruktur.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Dengan pendekatan berbasis bukti ilmiah, kami membantu pasien memahami kondisi mereka dan menjalani
                program pemulihan dengan percaya diri.
              </p>
              <p className="mt-4 text-xs text-muted-foreground/70">
                * Konten placeholder - menunggu konfirmasi cerita resmi dari klien
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="right" delay={0.2}>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src="/images/logos/logos.png"
                  alt="Hafta Fisioterapi"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
              <div className="absolute -bottom-4 left-0 md:right-0 rounded-xl bg-primary p-4 text-white shadow-lg sm:left-auto sm:right-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">5+</p>
                  <p className="text-xs">Tahun Pengalaman</p>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          {values.map((value, index) => (
            <ScrollAnimation key={value.title} delay={index * 0.1}>
              <div className="flex items-start gap-4 rounded-xl border border-border bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <value.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{value.description}</p>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </Container>
    </Section>
  );
}
