"use client";

import Image from "next/image";
import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { Footprints, Heart, Stethoscope, Activity, ArrowRight } from "lucide-react";

const services = [
  {
    id: "1",
    title: "Cedera Olahraga",
    description:
      "Pemulihan cedera olahraga seperti sprain, strain, dan rehabilitasi pasca operasi untuk kembali ke aktivitas.",
    icon: Activity,
    image: "/images/models/model-patient-2.png",
    gradient: "from-emerald-900/90 to-emerald-800/70",
    status: "PLACEHOLDER" as const,
  },
  {
    id: "2",
    title: "Nyeri Punggung & Leher",
    description:
      "Penanganan nyeri punggung bawah, nyeri leher, dan ketidaknyamanan akibat postur atau aktivitas sehari-hari.",
    icon: Stethoscope,
    image: "/images/models/model-patient-3.png",
    gradient: "from-teal-700/90 to-teal-600/70",
    status: "PLACEHOLDER" as const,
  },
  {
    id: "3",
    title: "Rehabilitasi Pasca Operasi",
    description:
      "Program pemulihan terstruktur setelah operasi ortopedi untuk mengembalikan fungsi dan kekuatan.",
    icon: Heart,
    image: "/images/models/model-patient-4.png",
    gradient: "from-emerald-700/90 to-emerald-600/70",
    status: "PLACEHOLDER" as const,
  },
  {
    id: "4",
    title: "Kesehatan Sendi & Otot",
    description:
      "Penanganan keluhan sendi, encok, dan masalah muskuloskeletal lainnya.",
    icon: Footprints,
    image: "/images/models/model-patient-5.png",
    gradient: "from-slate-700/90 to-slate-600/70",
    status: "PLACEHOLDER" as const,
  },
];

export function ServicesSection() {
  return (
    <Section id="layanan" className="bg-white">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Layanan Kami
            </h2>
            <p className="mt-3 text-muted-foreground">
              Berbagai kondisi yang dapat ditangani dengan pendampingan
              fisioterapi profesional
            </p>
          </div>
        </ScrollAnimation>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <ScrollAnimation key={service.id} delay={index * 0.1}>
              <div className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient}`} />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mb-3">
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/80 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-sm font-medium text-white opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    Selengkapnya
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>

        <ScrollAnimation delay={0.4}>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Tidak yakin dengan kondisi Anda?{" "}
              <a
                href="https://wa.me/6281234567890"
                className="font-medium text-primary hover:underline"
              >
                Konsultasikan dengan kami
              </a>
            </p>
          </div>
        </ScrollAnimation>
      </Container>
    </Section>
  );
}
