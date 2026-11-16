import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Clock3, Home, LifeBuoy, ShieldAlert } from 'lucide-react';
import { getErrorInfo, isSafePath, normalizeErrorCode } from '@/lib/error-catalog';

export const metadata: Metadata = {
  title: 'Informasi Kendala',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function IncidentStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; ref?: string; digest?: string; from?: string }>;
}) {
  const params = await searchParams;
  const code = normalizeErrorCode(params.code);
  const info = getErrorInfo(code);
  const reference = params.ref?.replace(/[^A-Za-z0-9-]/g, '').slice(0, 40) || `HF-${code}`;
  const digest = params.digest?.replace(/[^A-Za-z0-9]/g, '').slice(0, 32) || null;
  const from = isSafePath(params.from) ? params.from : null;

  return (
    <div className="min-h-screen bg-[#FCFCFB] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition-colors hover:text-[#181700]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Kembali ke beranda
        </Link>

        <div className="mt-5 rounded-3xl border border-stone-200/80 bg-white p-5 shadow-[0_18px_50px_-32px_rgba(24,23,0,0.35)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <ShieldAlert className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                Informasi kendala · {code}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-[#181700] sm:text-2xl">
                {info.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{info.description}</p>
            </div>
          </div>

          <dl className="mt-5 divide-y divide-stone-100 rounded-2xl border border-stone-200/80 bg-[#FAFAF8] px-4">
            <div className="flex flex-wrap items-start justify-between gap-2 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Referensi insiden</dt>
              <dd className="break-all font-mono text-xs font-semibold text-[#181700]">{reference}</dd>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Kode status</dt>
              <dd className="font-mono text-xs text-stone-700">HTTP {code}</dd>
            </div>
            {digest ? (
              <div className="flex flex-wrap items-start justify-between gap-2 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Digest server</dt>
                <dd className="break-all font-mono text-xs text-stone-700">{digest}</dd>
              </div>
            ) : null}
            {from ? (
              <div className="flex flex-wrap items-start justify-between gap-2 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Halaman</dt>
                <dd className="break-all font-mono text-xs text-stone-700">{from}</dd>
              </div>
            ) : null}
            <div className="flex flex-wrap items-start justify-between gap-2 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Waktu akses</dt>
              <dd className="inline-flex items-center gap-1.5 text-xs text-stone-700">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-2xl border border-stone-200/80 p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500">Yang dapat Anda lakukan</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{info.hint}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-stone-600">
              <li>Muat ulang halaman tujuan sekali lagi.</li>
              <li>Periksa koneksi internet atau coba dari jaringan lain.</li>
              <li>Jika kendala berulang, hubungi tim Hafta dan sertakan referensi di atas.</li>
            </ol>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {from ? (
              <Link
                href={from}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)]"
              >
                Coba halaman sebelumnya
              </Link>
            ) : null}
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Beranda
            </Link>
            <Link
              href="/kontak"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Hubungi tim Hafta
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-[10.5px] leading-relaxed text-stone-400">
          Halaman ini tidak memuat data rekam medis. Jangan mengirimkan data pasien melalui kanal dukungan.
        </p>
      </div>
    </div>
  );
}
