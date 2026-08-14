import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Container } from '@/components/container';
import { ServicesDetailSection } from '@/components/landing/services-detail-section';
import { ContactSection } from '@/components/landing/contact-section';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Layanan — Hafta Fisioterapi',
  description:
    'Daftar layanan fisioterapi Hafta: cedera olahraga, nyeri punggung & leher, rehabilitasi pasca operasi, serta kesehatan sendi dan otot.',
};

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-emerald-900 to-emerald-800 text-white">
          <Container>
            <div className="flex items-center gap-1.5 pt-8 text-sm text-white/70">
              <Link href="/" className="transition-colors hover:text-white">
                Beranda
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Layanan</span>
            </div>

            <div className="max-w-2xl py-12 md:py-16">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Layanan Kami</h1>
              <p className="mt-4 text-emerald-100/90 leading-relaxed">
                Berbagai kondisi yang dapat ditangani dengan pendampingan fisioterapi profesional. Setiap program
                dirancang bersama Anda, dimulai dari konsultasi awal hingga evaluasi perkembangan.
              </p>
            </div>
          </Container>
        </section>

        <ServicesDetailSection />

        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
