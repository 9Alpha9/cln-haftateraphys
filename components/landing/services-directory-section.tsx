'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, MessageCircle, ChevronRight, ShieldPlus, BadgeInfo } from 'lucide-react';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { services, type Service } from '@/components/landing/services-data';
import { cn } from '@/lib/utils';

export function ServicesDirectorySection() {
  const [activeId, setActiveId] = useState<string>(services[0]?.id || 'cedera-olahraga');

  const activeService: Service =
    services.find((s) => s.id === activeId) || services[0];

  return (
    <Section id="panduan-klinis" className="border-t border-stone-200/60 bg-[#FEFEF6] py-12 md:py-20 lg:py-24">
      <Container>
        {/* Header Section Panduan */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
            Direktori Klinis Interaktif
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl lg:text-4xl">
            Panduan &amp; Alur Penanganan Sesuai Keluhan
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-stone-600 sm:text-sm lg:text-base">
            Pilih kategori di bawah untuk mempelajari gejala yang sering ditangani, tahapan pemeriksaan di klinik,
            serta opsi pendampingan yang tepat untuk Anda.
          </p>
        </div>

        {/* ── 1. MOBILE & TABLET (< 1024px): 2x2 COMPACT SELECTOR GRID ── */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 lg:hidden">
          {services.map((item, idx) => {
            const isActive = item.id === activeId;
            const number = String(idx + 1).padStart(2, '0');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={cn(
                  'group flex flex-col justify-between rounded-2xl p-3 text-left transition-all duration-200 sm:p-3.5',
                  isActive
                    ? 'border-2 border-[var(--hafta-ylw-950)] bg-[var(--hafta-ylw-950)] text-white shadow-md'
                    : 'border border-stone-200/90 bg-white text-[var(--hafta-ylw-950)] shadow-2xs hover:border-stone-300'
                )}
              >
                {/* Baris Atas: Badge Nomor & Indikator */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-lg px-1.5 py-0.5 font-mono text-[11px] font-bold',
                      isActive
                        ? 'bg-white/15 text-[var(--hafta-ylw-100)]'
                        : 'bg-stone-100 text-stone-600'
                    )}
                  >
                    {number}
                  </span>
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full transition-transform',
                      isActive ? 'bg-[var(--hafta-ylw-100)] scale-110' : 'bg-stone-300'
                    )}
                    aria-hidden="true"
                  />
                </div>

                {/* Baris Bawah: Nama Layanan */}
                <span className={cn('mt-2 text-xs font-bold leading-snug line-clamp-2 sm:text-sm', isActive ? 'text-white' : 'text-[var(--hafta-ylw-950)]')}>
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 2. DESKTOP SPLIT VIEW (4-KOLOM MENU + 8-KOLOM PANEL) ── */}
        <div className="mt-6 grid gap-6 sm:gap-8 lg:mt-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          {/* SISI KIRI (4 KOLOM - DESKTOP ONLY 100% DIPERTAHANKAN) */}
          <div className="hidden space-y-2.5 lg:col-span-4 lg:block">
            {services.map((item, idx) => {
              const isActive = item.id === activeId;
              const number = String(idx + 1).padStart(2, '0');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all duration-200',
                    isActive
                      ? 'border-l-4 border-l-[var(--hafta-ylw-100)] bg-[var(--hafta-ylw-950)] text-white shadow-md'
                      : 'border border-stone-200/70 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold font-mono transition-colors',
                        isActive
                          ? 'bg-white/10 text-[var(--hafta-ylw-100)]'
                          : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
                      )}
                    >
                      {number}
                    </span>
                    <div>
                      <h3 className={cn('text-sm font-bold', isActive ? 'text-white' : 'text-[var(--hafta-ylw-950)]')}>
                        {item.title}
                      </h3>
                      <p className={cn('text-[11px]', isActive ? 'text-stone-300' : 'text-stone-500')}>
                        {idx === 0
                          ? 'Sprain, ACL, Robekan Otot'
                          : idx === 1
                            ? 'Nyeri Punggung, Leher Kaku, Postur'
                            : idx === 2
                              ? 'Pasca Bedah Sendi & Tulang'
                              : 'Kesehatan Gerak & Sendi'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform duration-200',
                      isActive ? 'translate-x-0.5 text-[var(--hafta-ylw-100)]' : 'text-stone-400 group-hover:translate-x-0.5'
                    )}
                  />
                </button>
              );
            })}

            {/* Bantuan Pemilihan Sederhana */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-4.5 text-xs text-stone-600 shadow-2xs">
              <span className="font-bold text-[var(--hafta-ylw-950)]">Bingung memilih kategori?</span>
              <p className="mt-1 leading-relaxed">
                Fisioterapis kami akan melakukan evaluasi komprehensif pada sesi pertama untuk menentukan kategori yang paling tepat.
              </p>
            </div>
          </div>

          {/* SISI KANAN (8 KOLOM): PANEL INFORMASI DETAIL DINAMIS */}
          <div className="lg:col-span-8">
            <ScrollReveal
              key={activeService.id}
              className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
            >
              {/* Header Panel: Ikon Terkunci Rapi di Kanan Atas Sejajar Judul pada SEMUA Layar */}
              <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-5 sm:pb-6">
                <div className="flex-1 min-w-0">
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-2xl lg:text-3xl">
                    {activeService.title}
                  </h3>
                </div>

                {/* Ikon Bulat Kuning (Konsisten di Kanan Atas) */}
                {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-2xs sm:h-12 sm:w-12">
                  <activeService.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div> */}
              </div>

              {/* Grid: Gambar Visualisasi Proporsional + Pengantar Kapan Dibutuhkan */}
              <div className="mt-4 grid gap-5 md:mt-6 md:grid-cols-12 md:items-center md:gap-6">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-stone-100 shadow-2xs sm:rounded-2xl md:col-span-5">
                  <Image
                    src={activeService.image}
                    alt={activeService.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 35vw"
                    className="object-cover object-top"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-white drop-shadow-sm">
                    Klinik Hafta Sidoarjo
                  </span>
                </div>

                <div className="space-y-2 md:col-span-7 sm:space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--hafta-ylw-950)] sm:text-sm">
                    Kapan Anda Membutuhkan Layanan Ini?
                  </h4>
                  <p className="text-xs leading-relaxed text-stone-600 sm:text-sm">
                    {activeService.description}
                  </p>
                  <p className="text-[11px] leading-relaxed text-stone-500 sm:text-xs">
                    Didampingi terapis profesional dengan asesmen fungsional yang terukur, sehingga program latihan mandiri dapat dilanjutkan secara aman di rumah.
                  </p>
                </div>
              </div>

              {/* 2 Kolom Daftar Bersih (Clean Checklist) */}
              <div className="mt-6 divide-y divide-stone-100 border-t border-stone-100 pt-5 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-6 sm:divide-y-0 sm:pt-6">
                {/* Kolom 1: Gejala & Keluhan Umum */}
                <div className="pb-5 sm:pb-0">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--hafta-ylw-950)]">
                    <BadgeInfo className="h-4 w-4 text-[var(--hafta-ylw-600)]" />
                    Gejala &amp; Keluhan Umum
                  </div>
                  <ul className="mt-3 space-y-2 sm:space-y-2.5">
                    {activeService.conditions.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-xs text-stone-700 sm:text-sm">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hafta-ylw-950)]" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Kolom 2: Tahapan Penanganan di Klinik */}
                <div className="pt-5 sm:pt-0">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--hafta-ylw-950)]">
                    <ShieldPlus className="h-4 w-4 text-[var(--hafta-ylw-600)]" />
                    Tahapan Penanganan di Klinik
                  </div>
                  <ul className="mt-3 space-y-2 sm:space-y-2.5">
                    {activeService.benefits.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-xs text-stone-700 sm:text-sm">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Baris Aksi Bawah: Mobile tersusun vertikal (Tombol Utama di Atas), Desktop sejajar */}
              <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-stone-100 pt-5 sm:mt-8 sm:flex-row sm:items-center">
                <Link
                  href={`/layanan/${activeService.id}`}
                  className="inline-flex items-center justify-center gap-1.5 text-center text-xs font-bold text-[var(--hafta-ylw-950)] transition-colors hover:text-stone-600 sm:justify-start"
                >
                  <span>Pelajari Selengkapnya Protokol Layanan Ini</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <a
                  href={`https://wa.me/6281232932872?text=Halo%20Hafta%20Fisioterapi,%20saya%20ingin%20konsultasi%20mengenai%20layanan%20${encodeURIComponent(activeService.title)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-950)] px-5 py-3 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-100)] hover:text-[var(--hafta-ylw-950)] sm:w-auto sm:py-2.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Konsultasikan Keluhan Ini
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
