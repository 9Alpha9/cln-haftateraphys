'use client';

import { useState } from 'react';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'Bagaimana cara memulai konsultasi di Hafta Fisioterapi?',
    answer:
      'Anda dapat menghubungi kami melalui WhatsApp atau langsung datang ke klinik. Tim kami akan membantu menjadwalkan sesi assessment awal untuk memahami keluhan dan kebutuhan Anda.',
  },
  {
    question: 'Apa yang perlu dipersiapkan sebelum datang sesi terapi?',
    answer:
      'Kenakan pakaian yang nyaman untuk bergerak. Jika Anda memiliki hasil pemeriksaan medis penunjang seperti rontgen, MRI, atau rujukan dokter spesialis, silakan bawa agar dapat menjadi referensi fisioterapis.',
  },
  {
    question: 'Apakah harus membuat akun Patient Portal terlebih dahulu?',
    answer:
      'Tidak wajib sebelum datang, namun sangat dianjurkan. Patient Portal mempermudah Anda mengisi riwayat awal keluhan dari rumah, sehingga sesi konsultasi di klinik dapat berjalan lebih optimal.',
  },
  {
    question: 'Bagaimana Patient Portal digunakan setelah terapi?',
    answer:
      'Patient Portal memungkinkan Anda memantau catatan perkembangan terapi yang difinalisasi oleh terapis, melihat anjuran latihan mandiri di rumah, dan mengelola keamanan akun Anda.',
  },
  {
    question: 'Berapa durasi satu sesi fisioterapi?',
    answer:
      'Satu sesi fisioterapi umumnya berdurasi sekitar 45 hingga 60 menit, mencakup evaluasi kondisi hari itu, terapi manual atau modalitas sesuai kebutuhan, serta latihan terapeutik terpandu.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section id="faq" className="bg-[#FEFEF6] border-y border-stone-200/50">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
              Pertanyaan Umum
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] md:text-3xl">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="mt-3 text-stone-600">
              Informasi seputar pelayanan, persiapan kunjungan, dan alur terapi di Hafta Fisioterapi
            </p>
          </div>
        </ScrollAnimation>

        <div className="mx-auto mt-10 max-w-3xl divide-y divide-stone-100 rounded-2xl border border-stone-200/70 bg-white p-2 sm:p-6 shadow-[0_8px_30px_rgb(24,23,0,0.03)]">
          {faqs.map((faq, index) => (
            <ScrollAnimation key={faq.question} delay={index * 0.04}>
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 text-left transition-colors hover:text-[var(--hafta-ylw-900)]"
                >
                  <span className="font-bold text-[var(--hafta-ylw-950)] text-[15px]">{faq.question}</span>
                  <motion.div
                    className="shrink-0"
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 text-stone-400" />
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
                        <p className="text-sm leading-relaxed text-stone-600">{faq.answer}</p>
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
