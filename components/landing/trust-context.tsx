"use client";

import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { MapPin, Clock, Shield, Users } from "lucide-react";

const trustItems = [
  {
    icon: MapPin,
    title: "Lokasi Strategis",
    description: "Terletak di Sidoarjo, mudah diakses dari berbagai area",
  },
  {
    icon: Clock,
    title: "Jadwal Fleksibel",
    description: "Menyesuaikan dengan waktu pasien untuk kenyamanan terapi",
  },
  {
    icon: Shield,
    title: "Pendekatan Berbasis Bukti",
    description: "Program terapi mengikuti standar evidance-based practice",
  },
  {
    icon: Users,
    title: "Tim Profesional",
    description: "Ditangani oleh fisioterapis bersertifikat dan berpengalaman",
  },
];

export function TrustContext() {
  return (
    <Section className="bg-white">
      <Container>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, index) => (
            <ScrollAnimation key={item.title} delay={index * 0.1} className="h-full">
              <div className="flex h-full items-start gap-4 rounded-xl border border-border p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
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
