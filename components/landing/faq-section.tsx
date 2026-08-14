'use client';

import { useState } from 'react';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'Bagaimana cara memulai konsultasi?',
    answer:
      'Anda dapat menghubungi kami melal WhatsApp atau langsung datang ke klinik. Kami akan menjadwalkan sesi assessment untuk memahami kondisi Anda.',
  },
  {
    question: 'Apa yang perlu dipersiapkan sebelum datang?',
    answer:
      'Siapkan data diri dan riwayat keluhan Anda. Jika ada hasil pemeriksaan sebelumnya (rontgen, MRI, dll), silakan bawa untuk referensi.',
  },
  {
    question: 'Apakah harus membuat akun terlebih dahulu?',
    answer:
      'Akun Patient Portal dibutuhkan untuk mengakses data dan riwayat terapi Anda. Anda dapat membuat akun saat pertama kali datang atau melalui website kami.',
  },
  {
    question: 'Bagaimana Patient Portal digunakan?',
    answer:
      'Patient Portal memungkinkan Anda melengkapi data diri, melihat status intake, mengakses informasi terapi yang telah difinalisasi, dan mengelola keamanan akun.',
  },
  {
    question: 'Bagaimana cara menghubungi Hafta?',
    answer:
      'Anda dapat menghubungi kami melalui WhatsApp di nomor yang tertera, atau datang langsung ke klinik kami di Sidoarjo.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section id="faq" className="bg-white">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Pertanyaan Umum</h2>
            <p className="mt-3 text-muted-foreground">Jawaban atas pertanyaan yang sering ditanyakan</p>
          </div>
        </ScrollAnimation>

        <div className="mx-auto mt-10 max-w-4xl divide-y divide-border ">
          {faqs.map((faq, index) => (
            <ScrollAnimation key={faq.question} delay={index * 0.05}>
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full cursor-pointer flex-col items-start gap-2"
                >
                  <span className="font-medium text-foreground">{faq.question}</span>
                  <motion.div animate={{ rotate: openIndex === index ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </Container>
    </Section>
  );
}
