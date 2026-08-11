"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { ClipboardCheck, Eye, History, Shield } from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Lengkapi Data Diri",
    description: "Isi informasi pasien secara terstruktur sebelum sesi terapi",
  },
  {
    icon: Eye,
    title: "Lihat Status",
    description: "Pantau status intake dan data yang telah Anda submit",
  },
  {
    icon: History,
    title: "Riwayat Terapi",
    description: "Akses informasi terapi yang telah difinalisasi oleh therapist",
  },
  {
    icon: Shield,
    title: "Keamanan Akun",
    description: "Kelola keamanan akun dan preferensi privasi Anda",
  },
];

export function PatientPortalSection() {
  return (
    <Section className="bg-emerald-900 text-white">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          <ScrollAnimation direction="left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Patient Portal
              </h2>
              <p className="mt-3 text-white/80">
                Akses informasi dan data terapi Anda secara online. Patient Portal
                memudahkan Anda untuk memantau perkembangan pemulihan.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 py-10">
                {features.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="mt-1 text-sm text-white/70">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-6 text-sm font-medium text-emerald-900 transition-colors hover:bg-white/90"
                >
                  Sudah menjadi pasien? Masuk Portal
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Buat Akun
                </Link>
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="right" delay={0.2}>
            <div className="relative mx-auto w-full max-w-xl lg:mx-0">
              <div className="aspect-[3/3] overflow-hidden rounded-2xl bg-white/10 relative">
                <Image
                  src="/images/portals/portals.png"
                  alt="Patient Portal"
                  fill
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
