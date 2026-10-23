'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { services } from '@/components/landing/services-data';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export function ServicesDetailSection() {
  return (
    <Section className="border-t border-stone-200/60 bg-[#FEFEF6] py-14 md:py-20">
      <Container>
        {/* Section Title */}
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
              Program Terapi
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
              Pilihan Layanan Fisioterapi
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-stone-600">
            Setiap program disesuaikan dengan derajat keluhan, tujuan personal, serta kenyamanan gerak Anda.
          </p>
        </div>

        {/* 2-Column Compact Editorial Grid */}
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
          {services.map((service, index) => {
            const formattedNumber = String(index + 1).padStart(2, '0');
            const Icon = service.icon;
            const topConditions = service.conditions.slice(0, 3);
            const topBenefits = service.benefits.slice(0, 3);

            return (
              <ScrollReveal key={service.id} delay={index * 0.08} className="h-full">
                <article
                  id={service.id}
                  className="group flex h-full scroll-mt-24 flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(24,23,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--hafta-ylw-400)]/60 hover:shadow-[0_14px_30px_rgba(24,23,0,0.07)] sm:p-7"
                >
                  <div>
                    {/* Top Media Bar: Foto Model Rasio 16:10 + Badge Nomor & Ikon */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-100 shadow-2xs">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#181700]/70 via-transparent to-transparent" />

                      {/* Nomor Urut Editorial (Pojok Kiri Atas) */}
                      <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-mono text-xs font-bold text-[var(--hafta-ylw-950)] shadow-xs backdrop-blur-sm">
                        <span>{formattedNumber}</span>
                        <span className="text-stone-300">/</span>
                        <span className="text-[11px] font-normal text-stone-500">HAFTA</span>
                      </div>

                      {/* Icon Kategori (Pojok Kanan Atas) */}
                      <div className="absolute right-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-xs">
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Mini Caption di Dalam Foto */}
                      <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs text-white">
                        <span className="font-medium drop-shadow-sm">Sesi 1-on-1 Privat</span>
                        <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-xs">
                          Klinik &amp; Homecare
                        </span>
                      </div>
                    </div>

                    {/* Judul & Deskripsi Ringkas */}
                    <div className="mt-5 sm:mt-6">
                      <h3 className="text-xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-2xl">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
                        {service.description}
                      </p>
                    </div>

                    {/* Clean Checklist (Anti-AI Slop: Tanpa Kotak-Kotak Sempit) */}
                    <div className="mt-5 grid grid-cols-1 gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2 sm:gap-6">
                      {/* Kolom Kiri: Fokus Keluhan */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--hafta-ylw-950)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                          Fokus Keluhan
                        </div>
                        <ul className="mt-3 space-y-2.5">
                          {topConditions.map((item) => (
                            <li key={item} className="flex items-start gap-2.5 text-xs text-stone-700 sm:text-sm">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-2xs">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </span>
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Kolom Kanan: Pendekatan Terapi */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--hafta-ylw-950)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                          Pendekatan Terapi
                        </div>
                        <ul className="mt-3 space-y-2.5">
                          {topBenefits.map((item) => (
                            <li key={item} className="flex items-start gap-2.5 text-xs text-stone-700 sm:text-sm">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[var(--hafta-ylw-950)] shadow-2xs">
                                <Sparkles className="h-2.5 w-2.5 text-[var(--hafta-ylw-600)]" />
                              </span>
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Info Singkat & Tombol CTA Elegan */}
                  <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center">
                    <span className="text-xs font-medium text-stone-500">
                      Tatap muka &amp; latihan terarah
                    </span>
                    <Link
                      href={`/layanan/${service.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-5 py-2.5 text-xs font-bold text-[var(--hafta-ylw-950)] shadow-2xs transition-all duration-200 hover:bg-[var(--hafta-ylw-200)] hover:shadow-xs sm:w-auto"
                    >
                      <span>Lihat Detail Layanan</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
