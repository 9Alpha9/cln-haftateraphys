'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCopy,
  Home,
  LifeBuoy,
  RefreshCcw,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { getErrorInfo, createIncidentReference, type AppErrorCode } from '@/lib/error-catalog';

type ErrorStateProps = {
  code: AppErrorCode;
  digest?: string | null;
  pathname?: string | null;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  primaryAction?: { href: string; label: string };
  showHome?: boolean;
  homeHref?: string;
  compact?: boolean;
};

const TONE_ICON = {
  danger: AlertTriangle,
  warning: ShieldAlert,
  info: Wrench,
} as const;

const TONE_STYLE = {
  danger: 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-600)]',
  warning: 'bg-amber-50 text-amber-600',
  info: 'bg-[var(--hafta-ble-50)] text-[var(--hafta-ble-600)]',
} as const;

export function ErrorState({
  code,
  digest,
  pathname,
  title,
  description,
  onRetry,
  retryLabel = 'Coba Lagi',
  primaryAction,
  showHome = true,
  homeHref = '/',
  compact = false,
}: ErrorStateProps) {
  const info = getErrorInfo(code);
  const reference = useMemo(() => createIncidentReference(code, digest), [code, digest]);
  const [copied, setCopied] = useState(false);
  const Icon = TONE_ICON[info.tone];

  const statusHref = `/status?code=${code}&ref=${encodeURIComponent(reference)}${digest ? `&digest=${encodeURIComponent(digest)}` : ''}${pathname ? `&from=${encodeURIComponent(pathname)}` : ''}`;

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={compact ? 'w-full' : 'flex min-h-[60vh] w-full items-center justify-center py-10'}>
      <div className="w-full max-w-xl">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-[0_18px_50px_-32px_rgba(24,23,0,0.35)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${TONE_STYLE[info.tone]}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                Error {code}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-[#181700] sm:text-2xl">
                {title ?? info.title}
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            {description ?? info.description}
          </p>

          <div className="mt-4 rounded-2xl border border-stone-200/80 bg-[#FAFAF8] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Referensi insiden
              </p>
              <button
                type="button"
                onClick={() => void copyReference()}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 text-[11px] font-semibold text-stone-600 transition-colors hover:bg-stone-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>
            <p className="mt-1 break-all font-mono text-xs text-[#181700]">{reference}</p>
            {digest ? (
              <p className="mt-1 break-all text-[10px] text-stone-400">Digest: {digest}</p>
            ) : null}
            {pathname ? (
              <p className="mt-1 break-all text-[10px] text-stone-400">Halaman: {pathname}</p>
            ) : null}
          </div>

          <p className="mt-3 text-[11.5px] leading-relaxed text-stone-500">{info.hint}</p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                {retryLabel}
              </button>
            ) : null}
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                {primaryAction.label}
              </Link>
            ) : null}
            {showHome ? (
              <Link
                href={homeHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Kembali ke beranda
              </Link>
            ) : null}
            <Link
              href={statusHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Informasi kendala
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-4 text-[11px] text-stone-500">
            <Link href="/kontak" className="inline-flex items-center gap-1.5 font-semibold text-stone-600 hover:text-[#181700]">
              <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
              Hubungi tim Hafta
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Gunakan tombol kembali browser bila perlu
            </span>
          </div>
        </div>

        <p className="mt-3 text-center text-[10.5px] leading-relaxed text-stone-400">
          Halaman ini tidak menampilkan data rekam medis. Jangan sertakan data pasien saat melapor.
        </p>
      </div>
    </div>
  );
}
