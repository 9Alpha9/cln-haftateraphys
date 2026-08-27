import type { Metadata } from 'next';
import { Container } from '@/components/container';
import { Footer } from '@/components/landing/footer';
import { PublicHeader } from '@/components/landing/navbar';
import { FaqSection } from '@/components/landing/faq-section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';

export const metadata: Metadata = {
  title: 'FAQ — Hafta Fisioterapi',
  description: 'Pertanyaan umum mengenai layanan dan portal pasien Hafta Fisioterapi.',
};

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1">
        <Container>
          <div className="py-12 md:py-16">
            <ScrollAnimation className="mx-auto mt-6 max-w-4xl">
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-10">
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Pertanyaan Umum</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Temukan jawaban atas pertanyaan yang paling sering ditanyakan mengenai layanan terapi kami, pendaftaran,
                  dan penggunaan Patient Portal.
                </p>
                <div className="mt-6 border-t border-border pt-2">
                  <FaqSection />
                </div>
                <section className="mt-8 rounded-xl bg-surface p-5">
                  <h2 className="font-semibold text-foreground">Punya pertanyaan lain?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Jika Anda memiliki pertanyaan spesifik tentang kondisi Anda atau membutuhkan informasi lebih lanjut,
                    jangan ragu untuk menghubungi kami.
                  </p>
                  <a
                    href="https://wa.me/6281232932872"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                  >
                    Hubungi via WhatsApp
                  </a>
                </section>
              </div>
            </ScrollAnimation>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
