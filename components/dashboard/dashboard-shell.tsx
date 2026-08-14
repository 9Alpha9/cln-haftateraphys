'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Menu, ChevronDown, Settings, ShieldCheck, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getRoleColor, getRoleLabel } from '@/lib/role-utils';
import { getDashboardNavigation } from '@/lib/permissions/dashboard-navigation';
import { signOut } from '@/lib/auth/client';
import { NotificationBell, type NotificationView } from "@/components/dashboard/notification-bell";
import type { Role } from '@/lib/permissions/roles';

export function AdminDashboardShell({
  children,
  role,
  userName,
  unreadCount = 0,
  recentNotifications = [],
}: {
  children: React.ReactNode;
  role: Role;
  userName?: string;
  unreadCount?: number;
  recentNotifications?: NotificationView[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = getDashboardNavigation(role);
  const dashboardTitle = role === 'SUPER_ADMIN' ? 'Administrasi Sistem' : 'Operasional Klinik';

  const goTo = (href: string) => router.push(href);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-white">
      <button
        type="button"
        aria-label="Tutup navigasi"
        className={cn('fixed inset-0 z-40 bg-emerald-950/45 lg:hidden', sidebarOpen ? 'block' : 'hidden')}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r border-border bg-white transition-transform duration-200 lg:translate-x-0',
          sidebarOpen && 'translate-x-0',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/images/logos/logos-text.png"
              alt="Hafta Fisioterapi"
              width={200}
              height={44}
              className="h-11 w-auto"
              priority
            />
            <span className="hidden lg:block">
              <span className="block text-xs text-muted-foreground">{dashboardTitle}</span>
            </span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
              pathname === '/dashboard'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-primary/5 hover:text-primary',
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Ringkasan
          </Link>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-primary/5 hover:text-primary',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', getRoleColor(role))}>
              {getRoleLabel(role)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white/95 px-4 backdrop-blur lg:px-6 xl:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{dashboardTitle}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Kelola akses dan operasional sesuai wewenang Anda
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell unreadCount={unreadCount} initialNotifications={recentNotifications} />
            <span className={cn('hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex', getRoleColor(role))}>
              {getRoleLabel(role)}
            </span>
            <DropdownMenu>
            <DropdownMenuTrigger
              className="flex cursor-pointer items-center gap-2 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menu akun"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                A
              </span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56">
              <DropdownMenuLabel>{userName ? <span className="truncate">{userName}</span> : 'Akun'}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => goTo('/dashboard/profile')}>
                <User className="h-4 w-4" aria-hidden="true" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => goTo('/dashboard/settings')}>
                <Settings className="h-4 w-4" aria-hidden="true" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => goTo('/dashboard/security')}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Keamanan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus-visible:bg-destructive/10">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
