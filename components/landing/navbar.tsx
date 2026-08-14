'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { LayoutDashboard, Menu, Phone, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/container';
import { useSession } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Beranda', href: '/' },
  { name: 'Layanan', href: '/layanan' },
  { name: 'Tentang Kami', href: '/tentang' },
  { name: 'Kontak', href: '#kontak' },
];

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  const initial = name?.trim().slice(0, 1).toUpperCase() || 'H';
  return image ? (
    <Image src={image} alt="Foto profil" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initial}
    </span>
  );
}

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, isPending } = useSession();
  const user = session?.user;

  return <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
    <Container>
      <div className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logos/logos-text.png" alt="Hafta Fisioterapi" width={108} height={72} className="h-18 w-auto" priority />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <span className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
          ) : user ? (
            <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost' }), 'gap-2.5')}>
              <UserAvatar name={user.name} image={user.image} />
              <span className="max-w-28 truncate">Dashboard</span>
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }))}>
                Masuk
              </Link>
              <Link href="/register" className={cn(buttonVariants())}>
                Daftar
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <Link href="/dashboard" aria-label="Buka dashboard">
              <UserAvatar name={user.name} image={user.image} />
            </Link>
          ) : (
            <a href="https://wa.me/6281232932872" target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
              <Phone className="h-4 w-4" />
              <span className="sr-only">Hubungi WhatsApp</span>
            </a>
          )}
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="sr-only">Buka menu</span>
          </Button>
        </div>
      </div>
      <div className={cn('overflow-hidden transition-all duration-200 md:hidden', mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0')}>
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="mt-3 flex flex-col gap-2">
          {user ? (
            <Link href="/dashboard" className={cn(buttonVariants(), 'w-full')} onClick={() => setMobileMenuOpen(false)}>
              <LayoutDashboard /> Buka Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')} onClick={() => setMobileMenuOpen(false)}>
                Masuk
              </Link>
              <Link href="/register" className={cn(buttonVariants(), 'w-full')} onClick={() => setMobileMenuOpen(false)}>
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </Container>
  </header>;
}
