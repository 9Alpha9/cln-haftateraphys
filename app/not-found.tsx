import { PublicHeader } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Container } from '@/components/container';
import { ErrorState } from '@/components/errors/error-state';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FCFCFB]">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center py-10">
        <Container>
          <ErrorState
            code={404}
            description="Alamat yang Anda buka tidak tersedia atau sudah dipindahkan. Periksa kembali tautan, atau kembali ke beranda untuk melanjutkan."
          />
        </Container>
      </main>
      <Footer />
    </div>
  );
}
