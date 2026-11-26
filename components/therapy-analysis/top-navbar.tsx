import Link from 'next/link';
import { Bell, MessageCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { key: string; label: string; href: string; active?: boolean }[] = [
  { key: 'overview', label: 'Ringkasan', href: '/dashboard' },
  { key: 'reports', label: 'Rekam Medis', href: '/dashboard/progress', active: true },
  { key: 'appointments', label: 'Jadwal Terapi', href: '/dashboard/appointments' },
  { key: 'prescriptions', label: 'Resep & Lab', href: '/dashboard/documents' },
];

/**
 * Navbar atas halaman analisis: brand kiri, navigasi pill tengah,
 * aksi ikon + avatar kanan. Link mengarah ke route portal nyata.
 */
export function TopNavbar({ userName }: { userName: string }) {
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      {/* ── brand ── */}
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hafta-950)] text-sm font-extrabold text-[var(--hafta-300)]"
        >
          H
        </span>
        <span className="text-sm font-bold tracking-tight text-foreground sm:text-base">Hafta Fisioterapi</span>
      </Link>

      {/* ── navigasi pill ── */}
      <nav
        aria-label="Navigasi utama"
        className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-full bg-accent/60 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:order-2 sm:w-auto"
        style={{ touchAction: 'manipulation' }}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={cn(
              'flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold transition-colors sm:text-sm',
              item.active
                ? 'bg-[#111827] text-white'
                : 'text-muted-foreground hover:bg-background hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* ── aksi & profil ── */}
      <div className="order-2 flex items-center gap-1.5 sm:order-3">
        <Link
          href="/dashboard"
          aria-label="Pencarian"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <Search className="h-4 w-4" />
        </Link>
        <Link
          href="/dashboard/notifications"
          aria-label="Pesan"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <MessageCircle className="h-4 w-4" />
        </Link>
        <Link
          href="/dashboard/notifications"
          aria-label="Notifikasi"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <Bell className="h-4 w-4" />
        </Link>
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hafta-300)] text-sm font-bold text-[#181700]"
        >
          {initials || 'P'}
        </span>
      </div>
    </header>
  );
}
