"use client";

import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { Phone, ClipboardList, Search, FileText, Activity, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Hubungi / Registrasi",
    description: "Hubungi kami melalui WhatsApp atau langsung datang ke klinik",
    icon: Phone,
  },
  {
    number: "02",
    title: "Lengkapi Informasi Awal",
    description: "Isi data diri dan keluhan melalui Patient Portal",
    icon: ClipboardList,
  },
  {
    number: "03",
    title: "Assessment",
    description: "Fisioterapis melakukan evaluasi menyeluruh terhadap kondisi Anda",
    icon: Search,
  },
  {
    number: "04",
    title: "Rencana Terapi",
    description: "Program terapi disusun berdasarkan hasil assessment",
    icon: FileText,
  },
  {
    number: "05",
    title: "Sesi & Monitoring",
    description: "Jalani sesi terapi dan pantau perkembangan melalui portal",
    icon: Activity,
  },
  {
    number: "06",
    title: "Evaluasi",
    description: "Evaluasi berkala untuk memastikan target pemulihan tercapai",
    icon: CheckCircle,
  },
];

export function TherapyProcessSection() {
  return (
    <Section className="bg-white">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Proses Terapi
            </h2>
            <p className="mt-3 text-muted-foreground">
              Langkah-langkah yang akan Anda lalui selama program pemulihan
            </p>
          </div>
        </ScrollAnimation>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <ScrollAnimation key={step.number} delay={index * 0.1}>
              <div className="relative flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </Container>
    </Section>
  );
}
