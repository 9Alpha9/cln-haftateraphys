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
  EXPIRED: 'border-stone-200 bg-stone-100 text-stone-600',
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

  function renderCard(consent: ConsentView) {
    const date = consent.grantedAt ? formatDate(consent.grantedAt) : null;
    const canGrant = ['PENDING', 'WITHDRAWN', 'EXPIRED', 'SUPERSEDED'].includes(consent.status);
    const canWithdraw = consent.status === 'GRANTED';

    return (
      <article
        key={consent.type}
        className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-[#181700]">{consent.label}</h3>
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
                <span className="rounded-full bg-[#F4F4F1] px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                  Wajib untuk layanan
                </span>
              ) : (
                <span className="rounded-full bg-[#F4F4F1] px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                  Opsional
                </span>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">{consent.description}</p>
            <p className="mt-2 text-[11px] text-stone-400">
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
      </article>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[#181700]">Persetujuan Layanan</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Persetujuan ini diperlukan agar tim Hafta dapat memberikan layanan fisioterapi dan
            memproses data Anda.
          </p>
        </div>
        <div className="space-y-3">{required.map(renderCard)}</div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[#181700]">Persetujuan Opsional</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Persetujuan publikasi bersifat opsional dan terpisah. Menolak atau menariknya tidak
            memengaruhi layanan klinis Anda.
          </p>
        </div>
        <div className="space-y-3">{optional.map(renderCard)}</div>
        {publication.length === 0 ? (
          <p className="rounded-2xl bg-[#FAFAF8] px-4 py-3 text-xs text-stone-500">
            Belum ada persetujuan opsional untuk ditampilkan.
          </p>
        ) : null}
      </section>

      <div className="flex items-start gap-2.5 rounded-2xl border border-stone-200 bg-[#FAFAF8] p-3.5 text-[11px] leading-relaxed text-stone-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#181700]" />
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
