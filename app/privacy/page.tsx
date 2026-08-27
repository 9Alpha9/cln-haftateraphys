import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/container';
import { Footer } from '@/components/landing/footer';
import { PublicHeader } from '@/components/landing/navbar';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Hafta Fisioterapi',
  description: 'Kebijakan privasi Hafta Fisioterapi.',
};

const sections = [
  {
    title: 'Informasi yang kami kumpulkan',
    content:
      'Kami dapat mengumpulkan informasi yang Anda berikan saat membuat akun, menghubungi kami, atau menggunakan layanan. Informasi ini dapat mencakup nama, email, nomor telepon, dan data lain yang diperlukan untuk menyediakan layanan atau menjalankan Patient Portal.',
  },
  {
    title: 'Penggunaan informasi',
    content:
      'Informasi digunakan untuk mengelola akun, menanggapi pertanyaan, menjalankan layanan yang Anda minta, menjaga keamanan sistem, serta memenuhi kewajiban operasional yang berlaku.',
  },
  {
    title: 'Perlindungan data',
    content:
      'Kami menerapkan langkah teknis dan operasional yang wajar untuk melindungi informasi dari akses, penggunaan, perubahan, atau pengungkapan tanpa wewenang. Akses terhadap data dibatasi sesuai kebutuhan pekerjaan.',
  },
  {
    title: 'Berbagi informasi',
    content:
      'Kami tidak menjual informasi pribadi Anda. Informasi hanya dapat dibagikan apabila diperlukan untuk menyediakan layanan, memenuhi kewajiban hukum, atau setelah memperoleh dasar dan persetujuan yang sesuai.',
  },
  {
    title: 'Hak dan pilihan Anda',
    content:
      'Anda dapat menghubungi kami untuk menanyakan informasi pribadi yang kami kelola, memperbarui informasi akun, atau mengajukan pertanyaan terkait privasi. Permintaan akan ditinjau sesuai kewajiban dan kebijakan yang berlaku.',
  },
  {
    title: 'Pembaruan kebijakan',
    content:
      'Kebijakan ini dapat diperbarui dari waktu ke waktu. Versi terbaru akan tersedia pada halaman ini dan tanggal pembaruan akan disesuaikan saat kebijakan resmi disahkan.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1">
        <Container>
          <div className="py-12 md:py-16">
            <article className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-white p-6 shadow-sm md:p-10">
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Kebijakan Privasi</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Dokumen ini adalah draft kebijakan privasi untuk website Hafta Fisioterapi dan perlu ditinjau serta
                disahkan sebelum layanan menerima data pasien produksi.
              </p>
              <div className="mt-8 space-y-7">
                {sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{section.content}</p>
                  </section>
                ))}
              </div>
              <section className="mt-8 rounded-xl bg-surface p-5">
                <h2 className="font-semibold text-foreground">Hubungi kami</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Untuk pertanyaan terkait privasi, hubungi Hafta Fisioterapi melalui WhatsApp resmi.
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
            </article>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
