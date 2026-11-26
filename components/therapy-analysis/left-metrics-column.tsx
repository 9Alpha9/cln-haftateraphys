import Link from 'next/link';
import { ArrowUpRight, Download, Heart, Plus } from 'lucide-react';
import { BLOOD_STATUS, HEMOGLOBIN_LEVEL, HEARTRATE_ACTIVITY, LAB_ITEMS } from './data';

/**
 * Kolom metrik kiri: dua kartu vital pastel, kartu detak jantung,
 * dan daftar lab/resep dengan aksi unduh.
 */
export function LeftMetricsColumn() {
  return (
    <div className="min-w-0 space-y-4">
      {/* ── 1. dua kartu vital ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Kondisi darah — pastel kuning */}
        <section aria-label="Kondisi darah" className="rounded-[28px] bg-[#FEF9C3] p-4">
          <p className="text-xs font-semibold text-[#713F12]">{BLOOD_STATUS.label}</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-[#422006]">{BLOOD_STATUS.value}</span>
            <span className="text-[10px] font-medium text-[#713F12]/70">{BLOOD_STATUS.unit}</span>
          </div>
          <span className="mt-1.5 inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
            {BLOOD_STATUS.badge}
          </span>
          <svg aria-hidden="true" viewBox="0 0 120 40" className="mt-2 h-9 w-full" fill="none">
            <polyline
              points={BLOOD_STATUS.ecgPoints}
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </section>

        {/* Hemoglobin — pastel biru es */}
        <section aria-label="Hemoglobin" className="rounded-[28px] bg-[#E0F2FE] p-4">
          <p className="text-xs font-semibold text-[#075985]">{HEMOGLOBIN_LEVEL.label}</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-[#082F49]">{HEMOGLOBIN_LEVEL.value}</span>
            <span className="text-[10px] font-medium text-[#075985]/70">{HEMOGLOBIN_LEVEL.unit}</span>
          </div>
          <span className="mt-1.5 inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
            {HEMOGLOBIN_LEVEL.badge}
          </span>
          <svg aria-hidden="true" viewBox="0 0 120 40" className="mt-2 h-9 w-full" fill="none">
            <path d={HEMOGLOBIN_LEVEL.curvePath} stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </section>
      </div>

      {/* ── 2. detak jantung ── */}
      <section
        aria-label="Aktivitas detak jantung"
        className="rounded-[28px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">{HEARTRATE_ACTIVITY.label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{HEARTRATE_ACTIVITY.subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Tambah catatan detak jantung"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#FACC15] text-[#422006] transition-colors hover:bg-[#FDE047] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FACC15]/40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tabular-nums text-foreground">{HEARTRATE_ACTIVITY.value}</span>
            <span className="text-sm font-semibold text-muted-foreground">/{HEARTRATE_ACTIVITY.unit}</span>
          </div>
          {/* ilustrasi organ — ikon jantung, tanpa gambar berat */}
          <Heart aria-hidden="true" className="h-12 w-12 shrink-0 fill-[#EF4444]/15 text-[#EF4444]" strokeWidth={1.5} />
        </div>
      </section>

      {/* ── 3. lab & resep ── */}
      <section
        aria-label="Lab dan resep"
        className="rounded-[28px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-tight text-foreground">Lab &amp; Resep</h2>
          <Link
            href="/dashboard/documents"
            className="inline-flex min-h-9 items-center gap-1 rounded-full text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            Lihat Semua
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-border/70">
          {LAB_ITEMS.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-muted-foreground"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M3 2h7l3 3v9H3V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">{item.name}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {item.kind === 'resep' ? 'Resep dokter' : 'Pemeriksaan lab'}
                </span>
              </span>
              <Link
                href="/dashboard/documents"
                aria-label={`Unduh ${item.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                <Download className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
