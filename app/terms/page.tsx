import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { Container } from '@/components/container';
import { Footer } from '@/components/landing/footer';
import { PublicHeader } from '@/components/landing/navbar';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Hafta Fisioterapi',
  description: 'Syarat dan ketentuan penggunaan layanan Hafta Fisioterapi.',
};

const sections = [
  {
    title: 'Penerimaan syarat',
    content:
      'Dengan mengakses website, membuat akun, atau menggunakan layanan digital Hafta Fisioterapi, Anda menyetujui syarat dan ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, mohon untuk tidak menggunakan layanan digital kami.',
  },
  {
    title: 'Informasi layanan',
    content:
      'Informasi pada website ditujukan untuk kebutuhan umum dan tidak menggantikan pemeriksaan, assessment, atau arahan profesional dari fisioterapis. Informasi layanan dapat berubah sesuai kebutuhan operasional Hafta Fisioterapi.',
  },
  {
    title: 'Akun dan keamanan',
    content:
      'Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan aktivitas yang terjadi melalui akun Anda. Segera hubungi kami apabila Anda menduga terdapat akses tidak sah terhadap akun Anda.',
  },
  {
    title: 'Data yang Anda berikan',
    content:
      'Anda bertanggung jawab atas ketepatan informasi yang diberikan melalui website atau Patient Portal. Informasi kesehatan yang diperlukan untuk layanan akan dikelola sesuai Kebijakan Privasi dan proses operasional yang berlaku.',
  },
  {
    title: 'Penggunaan yang dilarang',
    content:
      'Anda tidak boleh menggunakan website untuk tujuan melanggar hukum, mengganggu keamanan sistem, mengakses data pihak lain tanpa hak, atau mengirimkan konten yang merugikan, menipu, maupun melanggar hak pihak lain.',
  },
  {
    title: 'Perubahan layanan dan ketentuan',
    content:
      'Kami dapat memperbarui, menangguhkan, atau mengubah bagian dari website maupun ketentuan ini bila diperlukan. Versi terbaru akan dipublikasikan pada halaman ini.',
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1">
        <Container>
          <div className="py-12 md:py-16">
            <article className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-white p-6 shadow-sm md:p-10">
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Syarat & Ketentuan</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Dokumen ini adalah draft syarat dan ketentuan untuk website Hafta Fisioterapi dan perlu ditinjau serta
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
                <h2 className="font-semibold text-foreground">Ketentuan layanan klinis</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Detail layanan fisioterapi, proses assessment, persetujuan tindakan, dan ketentuan klinis dapat
                  memiliki dokumen atau penjelasan terpisah sesuai kebutuhan layanan.
                </p>
              </section>
            </article>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
