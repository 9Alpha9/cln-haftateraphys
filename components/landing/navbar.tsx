'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Menu, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { useSession } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Beranda', href: '/' },
  { name: 'Layanan', href: '/layanan' },
  { name: 'Tentang Kami', href: '/tentang' },
  { name: 'Kontak', href: '/kontak' },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  const initial = name?.trim().slice(0, 1).toUpperCase() || 'H';
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element -- avatar berasal dari data URL/Storage privat pengguna.
    <img src={image} alt="Foto profil" className="h-9 w-9 rounded-full object-cover" />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hafta-org-100)] text-sm font-bold text-[var(--hafta-org-950)]">
      {initial}
    </span>
  );
}

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const user = session?.user;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/profile/avatar')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { avatarUrl?: string | null } | null) => {
        if (!cancelled) setAvatarUrl(data?.avatarUrl ?? null);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [user]);

  const avatarImage = avatarUrl ?? user?.image ?? null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/60 bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logos/logos-text.png"
              alt="Hafta Fisioterapi"
              width={108}
              height={72}
              className="h-16 w-auto"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative py-2 text-sm font-medium transition-colors',
                    active
                      ? 'text-[var(--hafta-950)]'
                      : 'text-stone-600 hover:text-[var(--hafta-950)]',
                  )}
                >
                  {item.name}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-0 -bottom-0.5 mx-auto h-0.5 rounded-full bg-[var(--hafta-300)] transition-[width] duration-300 ease-out',
                      active ? 'w-full' : 'w-0 group-hover:w-full',
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isPending ? (
              <span className="h-9 w-24 animate-pulse rounded-xl bg-stone-100" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
              >
                <UserAvatar name={user.name} image={avatarImage} />
                <span className="max-w-28 truncate">{user.name || 'Dashboard'}</span>
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
                >
                  Masuk
                </Link>
                <Link
                  href="https://wa.me/6281232932872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--hafta-300)] px-4 py-2.5 text-sm font-semibold text-[var(--hafta-950)] transition-colors hover:bg-[var(--hafta-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-300)] sm:px-5"
                >
                  Buat Janji
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <Link href="/dashboard" aria-label="Buka dashboard">
                <UserAvatar name={user.name} image={avatarImage} />
              </Link>
            ) : (
              <a
                href="https://wa.me/6281232932872"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--hafta-300)] text-[var(--hafta-950)] transition-colors hover:bg-[var(--hafta-400)]"
              >
                <Phone className="h-4 w-4" />
                <span className="sr-only">Hubungi WhatsApp</span>
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-stone-700"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Buka menu</span>
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'overflow-hidden transition-all duration-200 md:hidden',
            mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0',
          )}
        >
          <nav className="flex flex-col gap-1 pt-2" aria-label="Navigasi mobile">
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium',
                    active
                      ? 'bg-[var(--hafta-50)] font-bold text-[var(--hafta-950)]'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-[var(--hafta-950)]',
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--hafta-300)] px-4 py-2.5 text-sm font-semibold text-[var(--hafta-950)] transition-colors hover:bg-[var(--hafta-400)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" /> Buka Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Masuk Portal
                </Link>
                <Link
                  href="https://wa.me/6281232932872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--hafta-300)] px-4 py-2.5 text-sm font-semibold text-[var(--hafta-950)] hover:bg-[var(--hafta-400)]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Buat Janji (WhatsApp)
                </Link>
              </>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
