'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { IntakeDraftInput } from '@/lib/validators/patient-intake';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  photos: string | null;
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
    tone: 'bg-[var(--hafta-org-50)]/60 text-[#181700] border-[var(--hafta-org-200)]',
    description: 'Form awal Anda sudah terkirim dan sedang menunggu tinjauan fisioterapis.',
  },
  UNDER_REVIEW: {
    label: 'Sedang ditinjau',
    tone: 'bg-[var(--hafta-org-50)]/60 text-[#181700] border-[var(--hafta-org-200)]',
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

function parsePhotos(value: string | null | undefined): IntakeDraftInput['photos'] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is { name: string; type: string; size: number; data: string } =>
        Boolean(item && typeof item.name === 'string' && typeof item.data === 'string'),
    );
  } catch {
    return [];
  }
}

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
    photos: parsePhotos(intake.photos),
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
    title: 'Keluhan utama (RPS)',
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
    title: 'Riwayat penyakit dahulu (RPD)',
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
  const [selectedPhoto, setSelectedPhoto] = useState<{ name: string; data: string } | null>(null);
  const meta = INTAKE_STATUS_META[intake.status];

  return (
    <div className="space-y-4 sm:space-y-6">
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

      {parsePhotos(intake.photos).length > 0 ? (
        <section>
          <h3 className="text-sm font-bold text-[#181700]">Foto kondisi</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {parsePhotos(intake.photos).map((photo, index) => (
              <button
                key={`${photo.name}-${index}`}
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className="relative group h-32 w-full rounded-2xl border border-stone-200 overflow-hidden"
                aria-label={`Lihat foto ${photo.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.data}
                  alt={photo.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedPhoto ? (
        <Dialog open onOpenChange={(open) => !open && setSelectedPhoto(null)}>
          <DialogContent className="sm:max-w-[600px] p-6">
            <DialogHeader>
              <DialogTitle className="text-lg">Foto Kondisi Pasien</DialogTitle>
              <DialogDescription>{selectedPhoto.name}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center gap-4 mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.data}
                alt={selectedPhoto.name}
                className="max-h-[60vh] rounded-2xl border border-stone-200 object-contain shadow-lg"
              />
            </div>
            <button
              type="button"
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-50"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-3.5 w-3.5" /> Tutup
            </button>
          </DialogContent>
        </Dialog>
      ) : null}

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
