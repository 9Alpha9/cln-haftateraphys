'use client';

import type { IntakeDraftInput } from '@/lib/validators/patient-intake';

export type PatientIntakeHistoryItem = {
  id: string;
  version: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_REVISION' | 'ACCEPTED' | 'ARCHIVED';
  affectedArea: string | null;
  chiefComplaint: string | null;
  onsetDescription: string | null;
  triggeringEvent: string | null;
  aggravatingFactors: string | null;
  relievingFactors: string | null;
  dailyLimitations: string | null;
  previousInjuryHistory: string | null;
  surgeryHistory: string | null;
  relevantMedicalHistory: string | null;
  currentMedication: string | null;
  allergies: string | null;
  patientGoal: string | null;
  reviewMessage: string | null;
  reviewedAt: Date | null;
  dataAccuracyAcknowledged: number;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  patientName: string;
};

export const INTAKE_STATUS_META: Record<
  PatientIntakeHistoryItem['status'],
  { label: string; tone: string; description: string }
> = {
  DRAFT: {
    label: 'Draft',
    tone: 'bg-white text-stone-600 border-stone-200',
    description: 'Form awal belum dikirim. Lengkapi dan kirim saat Anda sudah siap.',
  },
  NEEDS_REVISION: {
    label: 'Perlu perbaikan',
    tone: 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)] border-[var(--hafta-red-200)]',
    description: 'Tim Hafta meminta Anda melengkapi atau memperbaiki beberapa jawaban.',
  },
  SUBMITTED: {
    label: 'Terkirim',
    tone: 'bg-[var(--hafta-ylw-50)]/60 text-[#181700] border-[var(--hafta-ylw-200)]',
    description: 'Form awal Anda sudah terkirim dan sedang menunggu tinjauan fisioterapis.',
  },
  UNDER_REVIEW: {
    label: 'Sedang ditinjau',
    tone: 'bg-[var(--hafta-ylw-50)]/60 text-[#181700] border-[var(--hafta-ylw-200)]',
    description: 'Fisioterapis sedang meninjau keluhan awal Anda.',
  },
  ACCEPTED: {
    label: 'Diterima',
    tone: 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)] border-[var(--hafta-grn-200)]',
    description: 'Form awal sudah diverifikasi dan menjadi acuan program terapi Anda.',
  },
  ARCHIVED: {
    label: 'Diarsipkan',
    tone: 'bg-stone-100 text-stone-500 border-stone-200',
    description: 'Form awal ini sudah menjadi riwayat episode sebelumnya.',
  },
};

export function intakeToFormValues(intake: PatientIntakeHistoryItem): Partial<IntakeDraftInput> {
  return {
    chiefComplaint: intake.chiefComplaint ?? '',
    affectedArea: intake.affectedArea ?? '',
    onsetDescription: intake.onsetDescription ?? '',
    triggeringEvent: intake.triggeringEvent ?? '',
    aggravatingFactors: intake.aggravatingFactors ?? '',
    relievingFactors: intake.relievingFactors ?? '',
    dailyLimitations: intake.dailyLimitations ?? '',
    previousInjuryHistory: intake.previousInjuryHistory ?? '',
    surgeryHistory: intake.surgeryHistory ?? '',
    relevantMedicalHistory: intake.relevantMedicalHistory ?? '',
    currentMedication: intake.currentMedication ?? '',
    allergies: intake.allergies ?? '',
    patientGoal: intake.patientGoal ?? '',
    dataAccuracyAcknowledged: intake.dataAccuracyAcknowledged === 1,
  };
}

function formatDate(value: Date | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const SUMMARY_SECTIONS = [
  {
    title: 'Keluhan utama',
    fields: [
      ['Keluhan yang dirasakan', 'chiefComplaint'],
      ['Area keluhan', 'affectedArea'],
      ['Awal keluhan', 'onsetDescription'],
      ['Pemicu', 'triggeringEvent'],
    ],
  },
  {
    title: 'Dampak & tujuan',
    fields: [
      ['Keterbatasan aktivitas', 'dailyLimitations'],
      ['Target terapi', 'patientGoal'],
      ['Faktor yang memperberat', 'aggravatingFactors'],
      ['Faktor yang meredakan', 'relievingFactors'],
    ],
  },
  {
    title: 'Riwayat kesehatan',
    fields: [
      ['Riwayat cedera', 'previousInjuryHistory'],
      ['Riwayat operasi', 'surgeryHistory'],
      ['Riwayat medis relevan', 'relevantMedicalHistory'],
      ['Obat saat ini', 'currentMedication'],
      ['Alergi', 'allergies'],
    ],
  },
] as const;

export function PatientIntakeSummaryContent({ intake }: { intake: PatientIntakeHistoryItem }) {
  const meta = INTAKE_STATUS_META[intake.status];

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>
            {meta.label}
          </span>
          <span className="text-xs text-stone-500">Versi {intake.version}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{meta.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-stone-500">Dikirim</dt>
            <dd className="mt-1 font-semibold text-[#181700]">{formatDate(intake.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Terakhir diperbarui</dt>
            <dd className="mt-1 font-semibold text-[#181700]">{formatDate(intake.updatedAt)}</dd>
          </div>
        </dl>
        {intake.reviewMessage ? (
          <div className="mt-4 rounded-2xl bg-[var(--hafta-red-50)] px-4 py-3 text-sm leading-relaxed text-[var(--hafta-red-800)]">
            <p className="font-semibold">Catatan dari fisioterapis</p>
            <p className="mt-1">{intake.reviewMessage}</p>
          </div>
        ) : null}
      </div>

      {SUMMARY_SECTIONS.map((section) => (
        <section key={section.title}>
          <h3 className="text-sm font-bold text-[#181700]">{section.title}</h3>
          <dl className="mt-3 divide-y divide-stone-100">
            {section.fields.map(([label, field]) => {
              const value = intake[field];
              return (
                <div key={field} className="grid gap-1 py-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-xs text-stone-500">{label}</dt>
                  <dd className="whitespace-pre-wrap text-sm leading-relaxed text-[#181700]">
                    {value || <span className="text-stone-400">Belum diisi</span>}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
