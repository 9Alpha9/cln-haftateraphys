import type { Metadata } from 'next';
import {
  Shirt,
  FileText,
  Smartphone,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { PublicHeader } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { NotchedCard, type NotchedCardVariant } from '@/components/ui/notched-card';
import { services } from '@/components/landing/services-data';
import { ServicesDirectorySection } from '@/components/landing/services-directory-section';
import { ContactSection } from '@/components/landing/contact-section';

export const metadata: Metadata = {
  title: 'Layanan Fisioterapi — Hafta Fisioterapi Sidoarjo',
  description:
    'Layanan fisioterapi terukur, privat, dan berbasis bukti di Sidoarjo: cedera olahraga, nyeri punggung & leher, rehabilitasi pasca operasi, serta kesehatan sendi dan otot.',
};

const serviceBadges = [
  'Ortopedi & Sport',
  'Postur & Tulang Belakang',
  'Pasca Bedah',
  'Muskuloskeletal',
];

const prepSteps = [
  {
    icon: Shirt,
    title: 'Pakaian Nyaman & Longgar',
    description:
      'Kenakan pakaian olahraga atau bahan elastis yang memudahkan terapis memeriksa rentang gerak sendi pada bagian tubuh yang bermasalah.',
  },
  {
    icon: FileText,
    title: 'Bawa Data Medis Pendukung',
    description:
      'Jika ada, bawa hasil rontgen, MRI, atau lembar rujukan dokter spesialis agar evaluasi riwayat cedera Anda semakin akurat.',
  },
  {
    icon: Smartphone,
    title: 'Registrasi Awal via Portal',
    description:
      'Isi data keluhan awal melalui Patient Portal sebelum berkunjung agar waktu sesi tatap muka dapat dimaksimalkan penuh untuk tindakan terapi.',
  },
];

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        {/* ── SECTION 1: CLEAN EDITORIAL HEADER & QUICK METRICS ── */}
        <section className="border-b border-stone-200/60 bg-white py-12 md:py-16 lg:py-20">
          <Container>
            {/* Split Header: Kiri Narasi, Kanan 3 Quick Metrics */}
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
              {/* Sisi Kiri (7 Kolom): Judul & Deskripsi Humanize */}
              <ScrollReveal direction="left" className="lg:col-span-7">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                  Pendampingan Pemulihan Fisik
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-4xl lg:text-5xl">
                  Layanan Fisioterapi
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base lg:text-lg">
                  Setiap tubuh memiliki ritme pemulihan yang berbeda. Di Hafta Fisioterapi Sidoarjo, kami memadukan
                  evaluasi klinis menyeluruh, terapi manual, dan program latihan bertahap agar Anda dapat kembali
                  bergerak dengan nyaman dan percaya diri.
                </p>
              </ScrollReveal>

              {/* Sisi Kanan (5 Kolom): 3 Indikator Tipografi Bersih (Divide-x) */}
              <ScrollReveal direction="right" delay={0.15} className="lg:col-span-5">
                <div className="grid grid-cols-3 divide-x divide-stone-200 border-y border-stone-200/80 py-4 lg:border-y-0 lg:py-2">
                  <div className="px-3 text-center sm:px-4">
                    <span className="block font-mono text-xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-2xl">
                      45–60
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                      Menit / Sesi
                    </span>
                    <span className="mt-0.5 block text-[10px] text-stone-500">
                      1-on-1 privat
                    </span>
                  </div>

                  <div className="px-3 text-center sm:px-4">
                    <span className="block font-mono text-xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-2xl">
                      Evidence
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                      Based Care
                    </span>
                    <span className="mt-0.5 block text-[10px] text-stone-500">
                      Protokol teruji
                    </span>
                  </div>

                  <div className="px-3 text-center sm:px-4">
                    <span className="block font-mono text-xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-2xl">
                      Digital
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                      Tracking
                    </span>
                    <span className="mt-0.5 block text-[10px] text-stone-500">
                      Patient portal
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </section>

        {/* ── SECTION 2: 4 COMPACT NOTCHED CARDS (INVERTED OUTLINE) ── */}
        <Section className="bg-white py-12 md:py-16">
          <Container>
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Fokus Penanganan
                </span>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                  4 Bidang Layanan Utama
                </h2>
              </div>
              <p className="max-w-md text-xs sm:text-sm text-stone-500">
                Pilih fokus terapi sesuai keluhan Anda untuk melihat tahapan penanganan terstruktur.
              </p>
            </div>

            {/* Grid 4 Kolom NotchedCard Compact Tanpa Foto Raksasa */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service, index) => {
                const variants: NotchedCardVariant[] = ['white', 'accent', 'dark', 'white'];
                const variant = variants[index % variants.length];
                const badge = serviceBadges[index] || 'Fisioterapi';
                const Icon = service.icon;

                return (
                  <ScrollReveal key={service.id} delay={index * 0.08} className="h-full">
                    <NotchedCard
                      variant={variant}
                      badge={badge}
                      icon={<Icon className="h-5 w-5" />}
                      title={service.title}
                      description={service.description}
                      href={`/layanan/${service.id}`}
                      buttonText="Lihat Detail"
                      showRings={variant === 'accent' || variant === 'dark'}
                      className="h-full min-h-[290px] sm:min-h-[310px]"
                    />
                  </ScrollReveal>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* ── SECTION 3: INTERACTIVE CLINICAL GUIDE (SPLIT DIRECTORY VIEW) ── */}
        <ServicesDirectorySection />

        {/* ── SECTION 4: APA YANG PERLU DISIAPKAN SEBELUM SESI PERTAMA? ── */}
        <Section className="border-t border-stone-200/60 bg-white py-14 md:py-20">
          <Container>
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                Panduan Pasien Baru
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                Apa yang Perlu Disiapkan Sebelum Sesi Pertama?
              </h2>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-stone-600">
                Langkah sederhana berikut membantu kami memberikan asesmen dan tindakan terapi yang paling aman bagi tubuh Anda.
              </p>
            </ScrollReveal>

            {/* 3 Kolom Minimalis dengan Garis Pembatas Tipis */}
            <div className="mt-12 grid gap-8 md:grid-cols-3 md:divide-x md:divide-stone-200">
              {prepSteps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <ScrollReveal
                    key={step.title}
                    delay={idx * 0.08}
                    className="flex flex-col justify-between md:px-6 first:md:pl-0 last:md:pr-0"
                  >
                    <div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FEFEF6] border border-stone-200/80 text-[var(--hafta-ylw-950)] shadow-2xs">
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-base font-bold text-[var(--hafta-ylw-950)]">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-stone-100 pt-3">
                      <span className="font-mono text-xs font-semibold text-stone-600">
                        Langkah {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>

            {/* Banner Penutup Humanize */}
            <ScrollReveal delay={0.2} className="mt-12 rounded-3xl border border-stone-200/80 bg-[#FEFEF6] p-6 sm:p-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-base font-bold text-[var(--hafta-ylw-950)]">
                    Punya pertanyaan khusus seputar kondisi fisik Anda?
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-stone-600">
                    Fisioterapis kami siap berdiskusi santai sebelum Anda menentukan jadwal kunjungan.
                  </p>
                </div>
                <a
                  href="https://wa.me/6281232932872?text=Halo%20Hafta%20Fisioterapi,%20saya%20ingin%20konsultasi%20mengenai%20keluhan%20saya%20sebelum%20membuat%20janji."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-5 py-2.5 text-xs font-bold text-[var(--hafta-ylw-950)] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-200)]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Tanya Tim Kami via WhatsApp</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── SECTION 5: LOKASI & KONTAK TERINTEGRASI ── */}
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
