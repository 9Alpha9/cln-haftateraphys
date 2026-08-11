"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { ArrowRight, LogIn } from "lucide-react";

export function HeroSection() {
  return (
    <Section className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 pt-12 pb-16 md:pt-20 md:pb-24">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
          <ScrollAnimation direction="left">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[44px] lg:leading-[52px]">
                Kembali bergerak dengan lebih percaya diri
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed lg:py-10">
                Pendampingan fisioterapi yang terstruktur untuk membantu memahami
                kondisi, menjalani program pemulihan, dan memantau perkembangan
                terapi.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="https://wa.me/6281234567890"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Buat Janji
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <LogIn className="h-4 w-4" />
                  Masuk Patient Portal
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span>Terstruktur & profesional</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span>berbasis bukti</span>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="right" delay={0.2}>
            <div className="relative mx-auto w-full max-w-xl lg:mx-0">
              <div className="aspect-[4/4.6] overflow-hidden rounded-2xl relative">
                <Image
                  src="/images/models/model-all-bodys-5.png"
                  alt="Hafta Fisioterapi"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -left-1 rounded-xl bg-white p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Profesional
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Terapis bersertifikat
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </Container>
    </Section>
  );
}
