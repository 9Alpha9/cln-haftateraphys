import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Clock3,
  MapPin,
  MessageCircle,
  Activity,
  HeartHandshake,
  ShieldCheck,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '@/components/container';
import { Footer } from '@/components/landing/footer';
import { InstagramCarousel } from '@/components/landing/instagram-carousel';
import { PublicHeader } from '@/components/landing/navbar';
import { Section } from '@/components/section';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const metadata: Metadata = {
  title: 'Tentang Kami — Hafta Fisioterapi',
  description:
    'Mengenal Hafta Fisioterapi Sidoarjo: mitra pemulihan fisik dan kesehatan gerak yang profesional, empatik, serta berbasis bukti ilmiah.',
};

const pillars = [
  {
    icon: HeartHandshake,
    title: 'Mendengarkan Keluhan Anda',
    description:
      'Kami meluangkan waktu untuk memahami rutinitas, pekerjaan, dan rasa cemas di balik keluhan gerak yang Anda alami.',
  },
  {
    icon: ShieldCheck,
    title: 'Terapi Berbasis Bukti',
    description:
      'Setiap tindakan mengacu pada standar fisioterapi terkini, mengutamakan keamanan dan efektivitas pemulihan jangka panjang.',
  },
  {
    icon: Activity,
    title: 'Edukasi Mandiri yang Jelas',
    description:
      'Kami membekali Anda panduan latihan di rumah dan pemahaman postur tubuh agar hasil terapi tidak mudah kambuh.',
  },
  {
    icon: CheckCircle2,
    title: 'Pemantauan Terstruktur',
    description:
      'Didukung Patient Portal digital, tahapan evaluasi dan riwayat kunjungan Anda tercatat rapi serta transparan.',
  },
];

const serviceHighlights = [
  {
    title: 'Fisioterapi Klinis & Muskuloskeletal',
    description:
      'Penanganan terarah untuk nyeri punggung bawah, leher kaku, frozen shoulder, serta gangguan sendi dan otot akibat aktivitas harian.',
    badge: 'Klinik Sidoarjo',
  },
  {
    title: 'Rehabilitasi Pasca Operasi & Cedera',
    description:
      'Program latihan bertahap pasca operasi tulang/sendi atau cedera olahraga untuk memulihkan rentang gerak dan kekuatan otot.',
    badge: 'Terarah & Terukur',
  },
  {
    title: 'Home Visit (Terapi ke Rumah)',
    description:
      'Layanan kunjungan fisioterapis langsung ke rumah bagi pasien lansia, pasca stroke, atau yang memiliki keterbatasan mobilitas di Sidoarjo.',
    badge: 'Wilayah Sidoarjo',
  },
  {
    title: 'On-Field & Sports Physio',
    description:
      'Pendampingan fisik langsung di lapangan bagi atlet dan komunitas olahraga untuk prevensi cedera serta penanganan darurat saat tanding.',
    badge: 'Event & Komunitas',
  },
];

const instagramImages = [
  '/images/instagram/thumbnails-hf-1.jpg',
  '/images/instagram/thumbnails-hf-2.jpg',
  '/images/instagram/thumbnails-hf-3.jpg',
  '/images/instagram/thumbnails-hf-4.jpg',
  '/images/instagram/thumbnails-hf-5.jpg',
  '/images/instagram/thumbnails-hf-7.jpg',
  '/images/instagram/thumbnails-hf-8.jpg',
  '/images/instagram/thumbnails-hf-16.jpg',
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        {/* Header / Hero: proporsi dan fokus gambar sama dengan halaman utama agar foto tidak terpotong */}
        <section className="relative isolate overflow-hidden bg-[var(--hafta-ylw-950)] text-white">
          <Image
            src="/images/backgrounds/bg-hf-11.png"
            alt="Fisioterapi profesional di Hafta Fisioterapi Sidoarjo"
            fill
            sizes="100vw"
            priority
            className="-z-20 object-cover object-[center_20%] lg:object-[center_15%]"
            quality={75}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-[#181700] via-[#181700]/85 to-[#181700]/50 lg:bg-gradient-to-r lg:from-[#181700]/90 lg:via-[#181700]/65 lg:to-transparent"
          />

          <Container>
            <ScrollReveal direction="left" className="max-w-2xl py-16 md:py-24">
              <div className="flex items-center gap-3">
                <span className="h-0.5 w-8 bg-[var(--hafta-ylw-100)] shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium tracking-wide text-white/90">
                  Tentang Hafta Fisioterapi
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Mendampingi setiap langkah pemulihan gerak Anda.
              </h1>

              <p className="mt-5 text-base leading-relaxed text-stone-200 sm:text-lg">
                Pemulihan fisik bukan sekadar rangkaian gerakan mekanis, melainkan proses mengembalikan rasa aman dan
                kenyamanan beraktivitas. Di Sidoarjo, kami hadir sebagai mitra fisioterapi yang mendengarkan keluhan
                Anda secara utuh dan terarah.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="https://wa.me/6281232932872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-6 text-sm font-bold text-[var(--hafta-ylw-950)] shadow-sm transition-colors hover:bg-[var(--hafta-ylw-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-100)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181700]"
                >
                  Konsultasi via WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/layanan"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#181700]"
                >
                  Jelajahi Layanan
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </section>

        {/* Filosofi & Cerita Kami */}
        <Section className="bg-white py-16 md:py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
              <ScrollReveal direction="left">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                  Kisah &amp; Dedikasi
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl lg:text-4xl">
                  Layanan fisioterapi yang ramah, jelas, dan dekat dengan Anda
                </h2>

                <p className="mt-5 text-base leading-relaxed text-stone-600">
                  Hafta Fisioterapi bermula dari kepedulian sederhana: banyak orang di sekitar kita menahan rasa nyeri
                  bertahun-tahun atau menghentikan hobi favoritnya karena merasa tidak ada penanganan yang benar-benar
                  memahami kebutuhan individual mereka.
                </p>

                <p className="mt-4 text-base leading-relaxed text-stone-600">
                  Kami mengintegrasikan evaluasi klinis mendalam dengan sentuhan empati manusia. Bagi kami, keberhasilan
                  terapi bukan hanya hilangnya gejala sementara, melainkan kembalinya rasa percaya diri Anda saat
                  bekerja, berolahraga, dan berkumpul bersama keluarga.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {pillars.map((item, idx) => (
                    <ScrollReveal
                      key={item.title}
                      delay={idx * 0.08}
                      className="rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-5 shadow-xs"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-xs">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3.5 font-bold text-[var(--hafta-ylw-950)] text-sm sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-stone-600">
                        {item.description}
                      </p>
                    </ScrollReveal>
                  ))}
                </div>
              </ScrollReveal>

              {/* Visual Card dengan framing yang konsisten */}
              <ScrollReveal direction="right" delay={0.2} className="relative pb-6 pr-2 sm:pb-8 sm:pr-4">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 shadow-xl">
                  <Image
                    src="/images/backgrounds/bg-hf-10.png"
                    alt="Sesi terapi fisioterapi di Hafta Fisioterapi Sidoarjo"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-[center_20%] lg:object-[center_15%]"
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
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Ragam Pendekatan Layanan */}
        <Section className="border-y border-stone-200/60 bg-[#FEFEF6] py-16 md:py-24">
          <Container>
            <ScrollReveal className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                Cakupan Layanan
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl lg:text-4xl">
                Solusi fisioterapi sesuai kebutuhan kondisi fisik Anda
              </h2>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                Dari penanganan nyeri harian hingga rehabilitasi mobilitas pasca cedera, berikut ragam format
                pendampingan yang kami sediakan untuk pasien di Sidoarjo dan sekitarnya.
              </p>
            </ScrollReveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {serviceHighlights.map((svc, idx) => (
                <ScrollReveal
                  key={svc.title}
                  delay={idx * 0.08}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div>
                    <span className="inline-block rounded-full bg-[#FEFEF6] px-3 py-1 text-xs font-semibold text-stone-700 border border-stone-200/70">
                      {svc.badge}
                    </span>
                    <h3 className="mt-4 text-base font-bold text-[var(--hafta-ylw-950)]">
                      {svc.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600">
                      {svc.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <Link
                      href="/layanan"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--hafta-ylw-950)] hover:text-stone-700"
                    >
                      Pelajari selengkapnya
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Informasi Praktis & Keterbukaan */}
        <Section className="bg-white py-16 md:py-24">
          <Container>
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                Informasi &amp; Kunjungan
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                Akses mudah menuju layanan kami
              </h2>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                Kami mengutamakan kenyamanan waktu dan privasi konsultasi Anda melalui sistem janji temu terstruktur.
              </p>
            </ScrollReveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <ScrollReveal delay={0} className="rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-7 shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)]">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[var(--hafta-ylw-950)]">Lokasi Klinik</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Praktik Fisioterapi di Sidoarjo, Jawa Timur. Lingkungan yang tenang dan nyaman untuk sesi terapi.
                </p>
                <a
                  href="https://maps.app.goo.gl/rtobQBMKrAMkcqxF7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--hafta-ylw-950)] hover:underline"
                >
                  Buka di Google Maps
                  <ArrowRight className="h-4 w-4" />
                </a>
              </ScrollReveal>

              <ScrollReveal delay={0.1} className="rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-7 shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)]">
                  <Clock3 className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[var(--hafta-ylw-950)]">Sistem Reservasi</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Sesi terapi dijadwalkan terlebih dahulu agar Anda tidak perlu mengantre lama dan terapis dapat
                  mempersiapkan program Anda secara optimal.
                </p>
                <a
                  href="https://wa.me/6281232932872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--hafta-ylw-950)] hover:underline"
                >
                  Cek Jadwal Tersedia
                  <ArrowRight className="h-4 w-4" />
                </a>
              </ScrollReveal>

              <ScrollReveal delay={0.2} className="rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-7 shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)]">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[var(--hafta-ylw-950)]">Konsultasi Awal</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Ragu mengenai keluhan atau jenis layanan yang tepat? Hubungi kami langsung melalui WhatsApp untuk
                  berdiskusi santai sebelum berkunjung.
                </p>
                <a
                  href="https://wa.me/6281232932872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--hafta-ylw-950)] hover:underline"
                >
                  Kirim Pesan WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </a>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Dokumentasi Nyata & Aktivitas Klinik */}
        <Section className="border-t border-stone-200/60 bg-[#FEFEF6] py-16 md:py-24">
          <Container>
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                Dokumentasi Nyata
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                Aktivitas &amp; Edukasi Fisioterapi
              </h2>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                Ikuti rutinitas pendampingan pasien, panduan gerakan mandiri, dan kegiatan on-field kami melalui
                Instagram resmi Hafta Fisioterapi.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.15} className="mt-10">
              <InstagramCarousel images={instagramImages} />
            </ScrollReveal>
          </Container>
        </Section>

        {/* Penutup Humanized CTA */}
        <Section className="bg-white py-16 md:py-20">
          <Container className="text-center">
            <ScrollReveal className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl lg:text-4xl">
                Siap memulihkan kenyamanan gerak Anda?
              </h2>
              <p className="mx-auto mt-4 text-base leading-relaxed text-stone-600">
                Setiap hari tanpa rasa nyeri adalah kesempatan untuk berkarya lebih baik. Ceritakan kondisi fisik Anda,
                kami siap mendampingi proses pemulihannya.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href="https://wa.me/6281232932872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-6 text-sm font-bold text-[var(--hafta-ylw-950)] shadow-sm transition-colors hover:bg-[var(--hafta-ylw-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-100)]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Hubungi via WhatsApp
                </a>
                <Link
                  href="/layanan"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-6 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
                >
                  Lihat Semua Layanan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
