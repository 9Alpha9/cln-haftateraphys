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
    description: 'Program terapi dirancang terukur untuk mencapai target pemulihan gerak Anda',
  },
  {
    icon: Heart,
    title: 'Pendekatan Holistik',
    description: 'Tidak hanya meredakan gejala, kami mendalami akar penyebab gangguan gerak Anda',
  },
  {
    icon: Shield,
    title: 'Standar Profesional',
    description: 'Seluruh intervensi terapi mengacu pada protokol evidence-based practice',
  },
];

export function AboutSection() {
  return (
    <Section id="tentang" className="bg-white">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <ScrollAnimation direction="left">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                Tentang Hafta Fisioterapi
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl lg:text-4xl">
                Pendampingan pemulihan fisik yang empatik, profesional, dan terpercaya
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-stone-600">
                Di Hafta Fisioterapi Sidoarjo, kami memahami bahwa rasa nyeri atau keterbatasan gerak
                bukan hanya menghambat aktivitas fisik, melainkan memengaruhi kenyamanan hidup dan
                semangat berkarya Anda sehari-hari.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-stone-600">
                Kami hadir dengan pendekatan komprehensif yang mengedepankan evaluasi mendalam,
                terapi manual, serta latihan terapeutik terarah. Didukung oleh integrasi Patient
                Portal digital, Anda dapat memantau setiap tahapan pemulihan secara transparan dan
                terkendali.
              </p>

              <div className="mt-8 space-y-4">
                {values.map((value) => (
                  <div key={value.title} className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-sm">
                      <value.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--hafta-ylw-950)] text-sm sm:text-base">
                        {value.title}
                      </h3>
                      <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-stone-600">
                        {value.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="right" delay={0.2}>
            <div className="relative pb-6 pr-2 sm:pb-8 sm:pr-4">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 shadow-xl">
                <Image
                  src="/images/backgrounds/bg-hf-11.png"
                  alt="Sesi pendampingan fisioterapi profesional di Hafta Fisioterapi Sidoarjo"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-[center_20%]"
                  priority
                />
              </div>

              <div className="absolute -bottom-2 right-2 sm:bottom-0 sm:right-0 rounded-2xl border border-white/10 bg-[var(--hafta-ylw-950)] px-5 py-3.5 text-white shadow-xl flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-[var(--hafta-ylw-100)]">5+</span>
                <div className="text-xs leading-tight font-medium text-stone-200">
                  <p className="font-bold text-white text-sm">Tahun Pengalaman</p>
                  <p className="text-[11px] text-stone-300">Klinis &amp; Olahraga</p>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </Container>
    </Section>
  );
}
