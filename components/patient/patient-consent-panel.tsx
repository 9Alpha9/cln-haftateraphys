'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { CONSENT_STATUS_LABEL, type ConsentStatus } from '@/lib/consent';
import type { ConsentView } from '@/server/queries/consents';
import { grantMyConsent, withdrawMyConsent } from '@/server/actions/consents';

const STATUS_STYLE: Record<ConsentStatus, string> = {
  GRANTED: 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
  PENDING: 'border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] text-[var(--hafta-org-800)]',
  WITHDRAWN: 'border-red-200 bg-red-50 text-red-700',
  EXPIRED: 'border-border bg-muted text-muted-foreground',
  SUPERSEDED: 'border-amber-200 bg-amber-50 text-amber-800',
};

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function ConsentIcon({ status }: { status: ConsentStatus }) {
  if (status === 'GRANTED') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'WITHDRAWN') return <XCircle className="h-4 w-4" />;
  if (status === 'PENDING') return <Clock3 className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

/**
 * Penjelasan mendetail per persetujuan agar pasien paham apa yang disetujui:
 * data apa yang diproses, untuk apa, dan sejauh mana cakupannya.
 */
const CONSENT_DETAILS: Record<string, readonly string[]> = {
  PRIVACY_DATA_PROCESSING: [
    'Data yang diproses: identitas (nama, No. RM, tanggal lahir, kontak), riwayat kesehatan (keluhan, diagnosis, hasil evaluasi), dan data administratif kunjungan.',
    'Tujuan: menyusun rencana terapi, mengevaluasi kemajuan, kebutuhan administrasi klinik, dan pemenuhan kewajiban catatan medis.',
    'Jangka waktu: selama Anda menjadi pasien Hafta dan sesuai periode penyimpanan dalam kebijakan retensi; tidak dibagikan ke pihak ketiga di luar yang diwajibkan hukum.',
  ],
  CLINICAL_SERVICE: [
    'Tindakan: pemeriksaan fisik, penilaian nyeri/ROM/kekuatan, terapi manual, modalitas, dan latihan terarah sesuai kondisi Anda.',
    'Pelaksana: fisioterapis berlisensi Hafta; rencana dan setiap perubahan tindakan dijelaskan kepada Anda terlebih dahulu.',
    'Anda dapat menghentikan atau menolak tindakan kapan saja dengan memberi tahu terapis, tanpa mengganggu hak layanan lain.',
  ],
  DOCUMENT_UPLOAD: [
    'Contoh dokumen: hasil rontgen/MRI/USG, surat rujukan, resep, atau catatan pemeriksaan lain yang relevan dengan terapi.',
    'Dokumen hanya diakses tim klinik yang menangani Anda, disimpan aman, dan tidak pernah dipublikasikan.',
    'Bersifat opsional — layanan tetap berjalan tanpa dokumen tambahan selama secara klinis memungkinkan.',
  ],
  MEDIA_PUBLICATION: [
    'Materi: foto atau video selama sesi terapi (wajah, latihan, fasilitas) untuk media sosial, website, dan materi edukasi Hafta.',
    'Opsional: menolak atau menarik persetujuan tidak memengaruhi layanan Anda; penarikan berlaku untuk materi baru dan permintaan penghapusan dapat diajukan untuk materi yang terbit.',
    'Tidak ada imbalan finansial; nama lengkap tidak dicantumkan tanpa izin terpisah.',
  ],
  TESTIMONIAL_PUBLICATION: [
    'Isi: kutipan cerita atau catatan pemulihan Anda, disertai nama sesuai kesepakatan atau inisial.',
    'Dipublikasikan hanya di kanal milik Hafta (website, media sosial, materi edukasi).',
    'Terpisah dari persetujuan layanan dan dapat ditarik kapan saja tanpa konsekuensi klinis.',
  ],
};

export function PatientConsentPanel({ consents }: { consents: ConsentView[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [withdrawTarget, setWithdrawTarget] = useState<ConsentView | null>(null);

  const required = consents.filter((consent) => consent.required);
  const optional = consents.filter((consent) => !consent.required);
  const publication = optional.filter((consent) => consent.publication);

  function grant(consent: ConsentView) {
    startTransition(async () => {
      try {
        await grantMyConsent(consent.type);
        showToast('success', `Persetujuan "${consent.label}" berhasil diberikan.`);
        router.refresh();
      } catch (error) {
        showToast(
          'error',
          error instanceof Error ? error.message : 'Persetujuan tidak dapat diberikan.',
        );
      }
    });
  }

  function withdraw(consent: ConsentView) {
    startTransition(async () => {
      try {
        await withdrawMyConsent(consent.type);
        setWithdrawTarget(null);
        showToast('success', `Persetujuan "${consent.label}" telah ditarik.`);
        router.refresh();
      } catch (error) {
        showToast(
          'error',
          error instanceof Error ? error.message : 'Persetujuan tidak dapat ditarik.',
        );
      }
    });
  }

  function renderRow(consent: ConsentView, index: number) {
    const date = consent.grantedAt ? formatDate(consent.grantedAt) : null;
    const canGrant = ['PENDING', 'WITHDRAWN', 'EXPIRED', 'SUPERSEDED'].includes(consent.status);
    const canWithdraw = consent.status === 'GRANTED';
    const details = CONSENT_DETAILS[consent.type] ?? [];

    return (
      <div
        key={consent.type}
        className={cn('p-4 sm:p-5', index > 0 && 'border-t border-border/70')}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">{consent.label}</h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                  STATUS_STYLE[consent.status],
                )}
              >
                <ConsentIcon status={consent.status} />
                {CONSENT_STATUS_LABEL[consent.status]}
              </span>
              {consent.required ? (
                <span className="rounded-full bg-[#F4F4F1] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Wajib untuk layanan
                </span>
              ) : (
                <span className="rounded-full bg-[#F4F4F1] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Opsional
                </span>
              )}
            </div>
            <p className="mt-2 text-xs font-medium leading-relaxed text-foreground/80">
              {consent.description}
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {details.map((line) => (
                <li
                  key={line}
                  className="flex gap-2 text-[11.5px] leading-relaxed text-muted-foreground"
                >
                  <span
                    className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--hafta-300)]"
                    aria-hidden="true"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[11px] text-muted-foreground">
              Versi kebijakan: {consent.policyVersion}
              {date ? ` · Disetujui ${date}` : ''}
            </p>
            {consent.status === 'SUPERSEDED' ? (
              <p className="mt-1 text-[11px] font-medium text-amber-700">
                Kebijakan telah diperbarui. Silakan berikan persetujuan ulang.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-2">
            {canGrant ? (
              <Button
                type="button"
                size="sm"
                onClick={() => grant(consent)}
                disabled={pending}
                className="h-9 px-4 text-xs font-bold"
              >
                {consent.status === 'PENDING' ? 'Setujui' : 'Setujui Ulang'}
              </Button>
            ) : null}
            {canWithdraw ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWithdrawTarget(consent)}
                disabled={pending}
                className="h-9 px-4 text-xs font-semibold text-red-700"
              >
                Tarik
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Persetujuan Layanan</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Persetujuan ini diperlukan agar tim Hafta dapat memberikan layanan fisioterapi dan
            memproses data Anda.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {required.map((consent, index) => renderRow(consent, index))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Persetujuan Opsional</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Persetujuan publikasi bersifat opsional dan terpisah. Menolak atau menariknya tidak
            memengaruhi layanan klinis Anda.
          </p>
        </div>
        {optional.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {optional.map((consent, index) => renderRow(consent, index))}
          </div>
        ) : null}
        {publication.length === 0 ? (
          <p className="rounded-2xl bg-[#FAFAF8] px-4 py-3 text-xs text-muted-foreground">
            Belum ada persetujuan opsional untuk ditampilkan.
          </p>
        ) : null}
      </section>

      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-[#FAFAF8] p-3.5 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
        <p>
          Riwayat persetujuan tidak dihapus. Setiap perubahan dicatat pada log audit dan dapat
          ditinjau oleh tim Hafta sesuai kewenangannya.
        </p>
      </div>

      <ConfirmDialog
        isOpen={Boolean(withdrawTarget)}
        title="Tarik persetujuan?"
        description={
          withdrawTarget
            ? `Persetujuan "${withdrawTarget.label}" akan ditarik. Riwayat tetap tersimpan dan dapat diberikan kembali kapan saja.`
            : undefined
        }
        confirmLabel="Tarik Persetujuan"
        cancelLabel="Batal"
        variant="destructive"
        pending={pending}
        onConfirm={() => withdrawTarget && withdraw(withdrawTarget)}
        onCancel={() => setWithdrawTarget(null)}
      />
    </div>
  );
}
