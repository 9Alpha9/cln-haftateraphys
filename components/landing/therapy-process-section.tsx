'use client';

import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { Phone, ClipboardList, Search, FileText, Activity, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Hubungi / Registrasi',
    description: 'Hubungi kami via WhatsApp atau langsung datang ke klinik untuk konsultasi',
    icon: Phone,
    isPortal: false,
  },
  {
    number: '02',
    title: 'Lengkapi Informasi Awal',
    description: 'Isi data diri dan keluhan awal secara praktis lewat Patient Portal',
    icon: ClipboardList,
    isPortal: true,
  },
  {
    number: '03',
    title: 'Assessment Klinis',
    description: 'Fisioterapis melakukan evaluasi menyeluruh terhadap gerak dan kondisi fisik Anda',
    icon: Search,
    isPortal: false,
  },
  {
    number: '04',
    title: 'Program Terapi',
    description: 'Rencana terapi terstruktur disusun sesuai diagnosis spesifik Anda',
    icon: FileText,
    isPortal: false,
  },
  {
    number: '05',
    title: 'Sesi & Monitoring',
    description: 'Jalani sesi terapi dan pantau catatan progres berkala via Patient Portal',
    icon: Activity,
    isPortal: true,
  },
  {
    number: '06',
    title: 'Evaluasi Pemulihan',
    description: 'Evaluasi berkala untuk memastikan target pemulihan fisik tercapai optimal',
    icon: CheckCircle,
    isPortal: false,
  },
];

function PortalBadge() {
  return (
    <span className="mt-2 inline-flex rounded-full bg-[var(--hafta-ylw-950)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--hafta-ylw-100)]">
      Patient Portal
    </span>
  );
}

export function TherapyProcessSection() {
  return (
    <Section className="border-y border-stone-200/50 bg-[#FEFEF6]">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
              Tahapan Alur
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] md:text-3xl">
              Proses Terapi
            </h2>
            <p className="mt-3 text-stone-600">
              Langkah transparan dan terstruktur yang Anda lalui dalam perjalanan pemulihan
            </p>
          </div>
        </ScrollAnimation>

        {/* Tampilan Mobile & Tablet (< 1024px): Vertical Timeline Stepper */}
        <div className="relative mt-12 border-l-2 border-dashed border-[var(--hafta-ylw-300)] ml-5 space-y-6 pl-6 lg:hidden">
          {steps.map((step, index) => (
            <ScrollAnimation key={step.number} delay={index * 0.06}>
              <div className="relative min-h-20">
                <div className="absolute -left-[42px] top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-xs font-bold text-[var(--hafta-ylw-950)] ring-4 ring-[#FEFEF6]">
                  {step.number}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--hafta-ylw-950)]">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">{step.description}</p>
                    {step.isPortal && <PortalBadge />}
                  </div>
                  <step.icon className="h-4 w-4 shrink-0 text-stone-500" />
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>

        {/* Tampilan Desktop (>= 1024px): Grid 3 Kolom x 2 Baris */}
        <div className="mt-14 hidden lg:grid lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <ScrollAnimation key={step.number} delay={index * 0.05}>
              <div className="group flex h-full flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[var(--hafta-ylw-200)] hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-sm font-bold text-[var(--hafta-ylw-950)] shadow-sm transition-transform duration-300 group-hover:scale-105">
                      {step.number}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 transition-colors group-hover:bg-[var(--hafta-ylw-50)] group-hover:text-[var(--hafta-ylw-950)]">
                      <step.icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-base font-bold text-[var(--hafta-ylw-950)]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.description}</p>
                  </div>
                </div>

                {step.isPortal && (
                  <div className="mt-5 pt-3 border-t border-stone-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hafta-ylw-950)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--hafta-ylw-100)]">
                      Patient Portal
                    </span>
                  </div>
                )}
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </Container>
    </Section>
  );
}
