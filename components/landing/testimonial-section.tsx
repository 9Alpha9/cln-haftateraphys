"use client";

import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { Marquee } from "@/components/ui/marquee";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: "1",
    displayName: "Pasien A",
    quote:
      "Setelah beberapa sesi terapi, nyeri punggung saya berangsur membaik. Therapist sangat profesional dan sabar menjelaskan setiap prosesnya.",
    context: "Fisioterapi Nyeri Punggung",
    rating: 5,
  },
  {
    id: "2",
    displayName: "Pasien B",
    quote:
      "Program rehabilitasi pasca operasi ACL sangat terstruktur. Saya merasa dipantau perkembangannya dan bisa kembali beraktivitas dengan percaya diri.",
    context: "Rehabilitasi Pasca Operasi",
    rating: 5,
  },
  {
    id: "3",
    displayName: "Pasien C",
    quote:
      "Patient Portal memudahkan saya melihat riwayat terapi dan memahami progres pemulihan. Sangat membantu untuk tetap termotivasi.",
    context: "Cedera Olahraga",
    rating: 5,
  },
  {
    id: "4",
    displayName: "Pasien D",
    quote:
      "Sangat puas dengan pelayanan. Fisioterapisnya komunikatif dan program terapinya jelas. Nyeri bahu saya sudah jauh berkurang.",
    context: "Fisioterapi Bahu",
    rating: 5,
  },
  {
    id: "5",
    displayName: "Pasien E",
    quote:
      "Awalnya ragu, tapi ternyata prosesnya mudah dan hasilnya nyata. Terima kasih Hafta atas bantuannya.",
    context: "Nyeri Leher",
    rating: 5,
  },
  {
    id: "6",
    displayName: "Pasien F",
    quote:
      "Anak saya mendapat penanganan yang tepat untuk cedera pergelangan kakinya. Sekarang sudah bisa beraktivitas normal kembali.",
    context: "Cedera Pergelangan Kaki",
    rating: 5,
  },
];

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) {
  return (
    <div className="w-[350px] shrink-0 rounded-xl border border-border bg-white p-6 mx-3">
      <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10" />

      <div className="flex gap-1">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
          />
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div className="mt-4 border-t border-border pt-4">
        <p className="font-medium text-foreground">
          {testimonial.displayName}
        </p>
        <p className="text-xs text-muted-foreground">
          {testimonial.context}
        </p>
      </div>
    </div>
  );
}

export function TestimonialSection() {
  return (
    <Section className="bg-surface overflow-hidden">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Apa Kata Mereka
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pengalaman pasien yang telah menjalani terapi bersama kami
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              * Testimonial ditampilkan dengan persetujuan pasien
            </p>
          </div>
        </ScrollAnimation>
      </Container>

      <div className="mt-10">
        <Marquee speed={25} pauseOnHover>
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </Marquee>
      </div>

      <div className="mt-4">
        <Marquee speed={20} pauseOnHover>
          {[...testimonials].reverse().map((testimonial) => (
            <TestimonialCard key={`reverse-${testimonial.id}`} testimonial={testimonial} />
          ))}
        </Marquee>
      </div>
    </Section>
  );
}
