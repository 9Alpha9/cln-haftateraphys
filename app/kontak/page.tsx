import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Navigation,
  Star,
  CheckCircle2,
  ArrowRight,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { Container } from '@/components/container';
import { PublicHeader } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Section } from '@/components/section';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { ContactReviewCard } from '@/components/landing/contact-review-card';
import { getFeaturableReviews } from '@/lib/featurable';

export const metadata: Metadata = {
  title: 'Kontak Person & Lokasi — Hafta Fisioterapi Sidoarjo',
  description:
    'Hubungi Hafta Fisioterapi Sidoarjo via WhatsApp 0812-3293-2872. Konsultasi langsung, janji temu klinik, layanan home visit, serta lokasi resmi Google Maps.',
};

export default async function ContactPage() {
  const reviewsData = await getFeaturableReviews();
  const writeUri =
    reviewsData.writeAReviewUri ||
    'https://www.google.com/maps/place//data=!4m3!3m2!1s0x2dd7e1fe019cbb3f:0xaba8dc7d616a8c89!12e1?g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA';

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        {/* Header Hero — Proporsi dan posisi gambar seragam dengan halaman utama agar foto tidak terpotong */}
        <section className="relative isolate overflow-hidden bg-[var(--hafta-ylw-950)] text-white">
          <Image
            src="/images/backgrounds/bg-hf-11.png"
            alt="Layanan Fisioterapi Hafta Sidoarjo"
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
            <ScrollReveal direction="left" className="max-w-2xl py-14 md:py-20 lg:py-24">
              <div className="flex items-center gap-3">
                <span className="h-0.5 w-8 bg-[var(--hafta-ylw-100)] shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium tracking-wide text-white/90">
                  Kontak Person &amp; Lokasi Klinik
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Kami siap mendengarkan keluhan gerak Anda.
              </h1>

              <p className="mt-5 text-base leading-relaxed text-stone-200 sm:text-lg">
                Jangan ragu untuk berdiskusi santai sebelum berkunjung. Hubungi fisioterapis kami untuk konsultasi
                awal, informasi jadwal terapi privat di klinik, maupun reservasi layanan ke rumah (home visit).
              </p>

              {/* Google Review Trust Badge */}
              <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 backdrop-blur-sm sm:inline-flex">
                <div className="flex items-center gap-1 text-[var(--hafta-ylw-100)]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <div className="text-xs sm:text-sm text-stone-200">
                  <span className="font-bold text-white">{reviewsData.rating.toFixed(1)} / 5.0</span>
                  <span className="mx-1.5 opacity-60">•</span>
                  <span>{reviewsData.userRatingCount} Ulasan Pasien Terverifikasi di Google Maps</span>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </section>

        {/* Kartu Informasi Kontak Utama */}
        <Section className="bg-white py-14 md:py-20">
          <Container>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* WhatsApp & Telepon */}
              <ScrollReveal delay={0} className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-6 shadow-xs">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-xs">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[var(--hafta-ylw-950)]">
                    Telepon &amp; WhatsApp
                  </h3>
                  <p className="mt-1 text-lg font-bold text-stone-900">
                    0812-3293-2872
                  </p>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600">
                    Respon cepat langsung dari tim fisioterapis untuk tanya jawab keluhan, tarif, dan jadwal kosong.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-200/60">
                  <a
                    href="https://wa.me/6281232932872?text=Halo%20Hafta%20Fisioterapi,%20saya%20ingin%20konsultasi%20mengenai%20keluhan%20gerak/terapi."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-4 py-2.5 text-xs font-bold text-[var(--hafta-ylw-950)] shadow-xs transition-colors hover:bg-[var(--hafta-ylw-200)]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chat WhatsApp
                  </a>
                </div>
              </ScrollReveal>

              {/* Lokasi Alamat Google Maps */}
              <ScrollReveal delay={0.08} className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-6 shadow-xs">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-xs">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[var(--hafta-ylw-950)]">
                    Alamat Praktik
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    Sidokare, Sidoarjo
                  </p>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600">
                    Kec. Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61213. Ruang terapi privat, higienis, dan sejuk.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-200/60">
                  <a
                    href="https://maps.app.goo.gl/rtobQBMKrAMkcqxF7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-800 shadow-xs transition-colors hover:bg-stone-50"
                  >
                    <Navigation className="h-4 w-4 text-[var(--hafta-ylw-950)]" />
                    Buka Google Maps
                  </a>
                </div>
              </ScrollReveal>

              {/* Jam Operasional Terjadwal */}
              <ScrollReveal delay={0.16} className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-6 shadow-xs">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-xs">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[var(--hafta-ylw-950)]">
                    Jam Operasional
                  </h3>
                  <div className="mt-2 space-y-1 text-xs sm:text-sm text-stone-700">
                    <p className="font-semibold text-stone-900">Senin – Sabtu:</p>
                    <p className="text-stone-600">08.00 – 20.00 WIB</p>
                    <p className="pt-1 font-semibold text-stone-900">Minggu &amp; Libur:</p>
                    <p className="text-stone-600">08.00 – 13.00 WIB</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-200/60">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Sistem Reservasi Terjadwal
                  </span>
                </div>
              </ScrollReveal>

              {/* Layanan Home Visit */}
              <ScrollReveal delay={0.24} className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-6 shadow-xs">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-[var(--hafta-ylw-950)] shadow-xs">
                    <Home className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[var(--hafta-ylw-950)]">
                    Layanan Home Visit
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    Area Sidoarjo Kota
                  </p>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600">
                    Terapis datang ke rumah Anda bagi lansia, pasien pasca operasi/stroke, atau yang terkendala mobilitas.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-200/60">
                  <a
                    href="https://wa.me/6281232932872?text=Halo%20Hafta%20Fisioterapi,%20saya%20ingin%20menanyakan%20jadwal%20layanan%20Home%20Visit%20ke%20rumah."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center  gap-1.5 text-xs font-bold text-[var(--hafta-ylw-950)] hover:underline"
                  >
                    Tanya Jadwal Homecare
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Peta Lokasi Google Maps Interaktif */}
        <Section className="border-t border-stone-200/60 bg-[#FEFEF6] py-14 md:py-20">
          <Container>
            <div className="grid gap-8 lg:grid-cols-3 lg:items-center lg:gap-12">
              <ScrollReveal direction="left" className="lg:col-span-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                  Peta Navigasi
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                  Kunjungi Hafta Fisioterapi di Sidoarjo
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
                  Lokasi mudah dijangkau dari berbagai sudut Kota Sidoarjo. Parkir aman dan ruang terapi yang dirancang
                  menenangkan untuk memastikan proses rehabilitasi Anda berlangsung tanpa distraksi.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 text-sm text-stone-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Ruang terapi privat satu-satu (one-on-one)</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-stone-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Area tenang dan bebas antrean panjang</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-stone-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Protokol kebersihan dan sterilisasi terjaga</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://maps.app.goo.gl/rtobQBMKrAMkcqxF7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-5 text-sm font-bold text-[var(--hafta-ylw-950)] shadow-xs transition-colors hover:bg-[var(--hafta-ylw-200)]"
                  >
                    <Navigation className="h-4 w-4" />
                    Buka Petunjuk Arah
                  </a>
                  <a
                    href={writeUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800 shadow-xs transition-colors hover:bg-stone-50"
                  >
                    Tulis Ulasan Google
                  </a>
                </div>
              </ScrollReveal>

              {/* Embed Google Maps */}
              <ScrollReveal direction="right" delay={0.15} className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-lg lg:col-span-2">
                <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[16/10]">
                  <iframe
                    src="https://www.google.com/maps?q=-7.4613804,112.708499&z=17&output=embed"
                    title="Peta Lokasi Hafta Fisioterapi Sidoarjo"
                    className="absolute inset-0 h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white border-t border-stone-100">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-700">
                    <MapPin className="h-4 w-4 shrink-0 text-[var(--hafta-ylw-950)]" />
                    <span>Sidokare, Sidoarjo, Jawa Timur (Koordinat: -7.46138, 112.70850)</span>
                  </div>
                  <a
                    href="https://maps.app.goo.gl/rtobQBMKrAMkcqxF7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[var(--hafta-ylw-950)] hover:underline"
                  >
                    Buka di Aplikasi Google Maps &rarr;
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Apa Kata Pasien di Google Review */}
        <Section className="bg-white py-14 md:py-20">
          <Container>
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
                Ulasan Google Review
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                Pengalaman Nyata Pasien di Hafta Fisioterapi
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
                Setiap review bersumber langsung dari Google Business Profile resmi kami.
              </p>
            </ScrollReveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviewsData.reviews.slice(0, 6).map((review, idx) => (
                <ScrollReveal
                  key={review.authorName}
                  delay={idx * 0.08}
                  className="h-full"
                >
                  <ContactReviewCard review={review} />
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={0.2} className="mt-10 text-center">
              <a
                href={writeUri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-xs transition-colors hover:bg-stone-50"
              >
                <Star className="h-4 w-4 text-[var(--hafta-ylw-950)]" />
                Beri Ulasan di Google Maps
                <ArrowRight className="h-4 w-4" />
              </a>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Panduan Sebelum Menghubungi Kami (Humanized) */}
        <Section className="border-t border-stone-200/60 bg-[#FEFEF6] py-14 md:py-20">
          <Container>
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] sm:text-3xl">
                Pertanyaan Sebelum Berkunjung
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
                Hal praktis yang perlu Anda ketahui agar kunjungan terapi berjalan nyaman.
              </p>
            </ScrollReveal>

            <div className="mx-auto mt-10 max-w-3xl space-y-4">
              <ScrollReveal delay={0.05} className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-[var(--hafta-ylw-950)]">
                  Apakah saya harus membuat janji temu terlebih dahulu?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Sangat disarankan. Kami menerapkan sistem reservasi janji temu agar Anda tidak perlu mengantre,
                  dan fisioterapis kami dapat mendedikasikan waktu satu sesi penuh hanya untuk Anda.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.1} className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-[var(--hafta-ylw-950)]">
                  Pakaian apa yang sebaiknya dikenakan saat terapi?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Kenakan pakaian longgar atau pakaian olahraga yang nyaman dan memudahkan pergerakan pada bagian
                  tubuh yang mengalami keluhan (misalnya celana pendek/training untuk keluhan lutut/kaki).
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.15} className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-[var(--hafta-ylw-950)]">
                  Apakah saya bisa membawa hasil rontgen, MRI, atau rujukan dokter?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Tentu, silakan bawa semua dokumen medis terkait. Fisioterapis kami akan mempelajari riwayat tersebut
                  bersama dengan hasil evaluasi fisik langsung di klinik.
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={0.2} className="mt-12 text-center">
              <p className="text-sm text-stone-600">Masih ada yang ingin ditanyakan?</p>
              <a
                href="https://wa.me/6281232932872?text=Halo%20Hafta%20Fisioterapi,%20saya%20ingin%20tanya-tanya%20mengenai%20layanan%20fisioterapi."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-6 text-sm font-bold text-[var(--hafta-ylw-950)] shadow-xs transition-colors hover:bg-[var(--hafta-ylw-200)]"
              >
                <MessageCircle className="h-4 w-4" />
                Tanyakan Langsung via WhatsApp
              </a>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
