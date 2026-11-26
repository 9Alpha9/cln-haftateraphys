import Link from 'next/link';
import { ArrowUpRight, FileText, MessageCircle } from 'lucide-react';
import { AI_ANALYTICS, APPOINTMENTS, MEDICINES } from './data';

/**
 * Kolom kanan: jadwal terapis, obat/suplemen, dan kartu AI analytics gelap.
 */
export function RightScheduleColumn() {
  return (
    <div className="min-w-0 space-y-4">
      {/* ── 1. jadwal terapis ── */}
      <section
        aria-label="Jadwal terapis mendatang"
        className="rounded-[28px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-tight text-foreground">Jadwal Mendatang</h2>
          <Link
            href="/dashboard/appointments"
            className="inline-flex min-h-9 items-center gap-1 rounded-full text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            Lihat Semua
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="mt-2 space-y-2.5">
          {APPOINTMENTS.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border/70 p-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${item.initialsClass}`}
                >
                  {item.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-foreground">{item.name}</span>
                  <span className="block text-[10px] text-muted-foreground">{item.role}</span>
                </span>
                <Link
                  href="/dashboard/notifications"
                  aria-label={`Chat dengan ${item.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FACC15] text-[#422006] transition-colors hover:bg-[#FDE047] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FACC15]/40"
                >
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </div>
              <span className="mt-2.5 inline-flex max-w-full items-center truncate rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-[var(--hafta-800)]">
                {item.visitTime}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 2. obat & suplemen ── */}
      <section
        aria-label="Obat dan suplemen"
        className="rounded-[28px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-tight text-foreground">Obat &amp; Suplemen</h2>
          <Link
            href="/dashboard/documents"
            className="inline-flex min-h-9 items-center gap-1 rounded-full text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            Lihat Semua
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="mt-2 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MEDICINES.map((medicine) => (
            <li
              key={medicine.id}
              className={`flex w-28 shrink-0 flex-col justify-between gap-2 rounded-2xl p-3 ${medicine.surfaceClass}`}
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-[#422006]"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <rect x="3" y="6" width="10" height="4" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 4.5v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold text-[#422006]">{medicine.name}</span>
                <span className="block text-[10px] font-medium text-[#713F12]/70">{medicine.dose}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 3. AI analytics ── */}
      <section
        aria-label="AI analytics"
        className="relative overflow-hidden rounded-[28px] bg-[#1C1C1E] p-5 text-white shadow-[0_8px_24px_rgba(28,25,23,0.16)]"
      >
        {/* siluet tulang belakang di latar */}
        <svg
          aria-hidden="true"
          viewBox="0 0 40 160"
          className="absolute -right-2 bottom-0 h-[85%] w-auto text-white/[0.07]"
          fill="currentColor"
        >
          {Array.from({ length: 9 }, (_, index) => {
            const y = 14 + index * 15;
            const width = 18 - index * 0.6;
            return (
              <g key={index}>
                <rect x={(40 - width) / 2} y={y} width={width} height={9} rx={3} />
                <rect x={(40 - 6) / 2} y={y + 9} width={6} height={5} rx={2.5} />
              </g>
            );
          })}
        </svg>

        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-white/70">
              {AI_ANALYTICS.badge}
            </span>
            <FileText aria-hidden="true" className="h-4 w-4 text-white/40" />
          </div>
          <h2 className="text-balance mt-3 text-lg font-bold tracking-tight">{AI_ANALYTICS.title}</h2>
          <p className="mt-1.5 max-w-[85%] text-xs leading-relaxed text-white/60">{AI_ANALYTICS.description}</p>
          <span
            aria-hidden="true"
            className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#FACC15] text-[#1C1C1E]"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </section>
    </div>
  );
}
