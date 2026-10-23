'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { ClipboardCheck, Eye, History, Shield, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Lengkapi Data Diri',
    description: 'Isi informasi pasien secara terstruktur sebelum sesi terapi dimulai',
  },
  {
    icon: Eye,
    title: 'Lihat Status Intake',
    description: 'Pantau status verifikasi dan data yang telah Anda kirimkan',
  },
  {
    icon: History,
    title: 'Riwayat & Progres Terapi',
    description: 'Akses catatan terapi dan evaluasi resmi dari fisioterapis Anda',
  },
  {
    icon: Shield,
    title: 'Keamanan Data Terjaga',
    description: 'Privasi data medis dan keamanan akun Anda terproteksi standar ketat',
  },
];

export function PatientPortalSection() {
  return (
    <Section className="bg-[#FEFEF6] border-y border-stone-200/50">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <ScrollAnimation direction="left">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                Layanan Digital Pasien
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] md:text-3xl">
                Pantau perkembangan terapi Anda melalui Patient Portal
              </h2>
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                Akses informasi dan riwayat terapi Anda secara online kapan saja. Patient Portal
                memudahkan Anda mengisi formulir awal dari rumah, melihat perkembangan pemulihan, dan
                mengakses rekomendasi latihan mandiri.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-[0_8px_30px_rgb(24,23,0,0.03)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-sm">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--hafta-ylw-950)] text-sm">{feature.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-6 text-sm font-semibold text-[var(--hafta-ylw-950)] shadow-sm transition-colors hover:bg-[var(--hafta-ylw-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-100)]"
                >
                  Masuk Patient Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                >
                  Daftar Akun Baru
                </Link>
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="right" delay={0.2}>
            <div className="relative mx-auto w-full max-w-xl lg:mx-0">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_12px_40px_rgba(24,23,0,0.06)]">
                <Image
                  src="/images/portals/portals.png"
                  alt="Ilustrasi Patient Portal Hafta Fisioterapi"
                  fill
                  sizes="(max-width: 1024px) 100vw, 38rem"
                  className="object-contain p-4"
                />
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </Container>
    </Section>
  );
}
