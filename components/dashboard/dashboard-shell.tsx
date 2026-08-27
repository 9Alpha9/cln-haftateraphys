'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, Settings, User, LogOut, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarAccountMenu } from '@/components/dashboard/sidebar-account-menu';
import { cn } from '@/lib/utils';
import { getRoleColor, getRoleLabel } from '@/lib/role-utils';
import { getDashboardNavigation } from '@/lib/permissions/dashboard-navigation';
import { signOut } from '@/lib/auth/client';
import { NotificationBell, type NotificationView } from '@/components/dashboard/notification-bell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Role } from '@/lib/permissions/roles';

export function AdminDashboardShell({
  children,
  role,
  userName,
  userEmail,
  unreadCount = 0,
  recentNotifications = [],
}: {
  children: React.ReactNode;
  role: Role;
  userName?: string;
  userEmail?: string;
  unreadCount?: number;
  recentNotifications?: NotificationView[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navGroups = getDashboardNavigation(role);
  const dashboardTitle = role === 'SUPER_ADMIN' ? 'Administrasi Sistem' : 'Operasional Klinik';

  const goTo = (href: string) => router.push(href);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-[#F6FAF8]">
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
        <div className="flex h-20 items-center justify-between border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/images/logos/logos-text.png"
              alt="Hafta Fisioterapi"
              width={90}
              height={60}
              className="h-12 w-auto object-contain"
              priority
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {dashboardTitle}
            </span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-6">
          {navGroups.map((group) => {
            const visibleItems = group.items;
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label} className="px-4">
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                           className={cn(
                            'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                            active
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                              : 'text-slate-600 hover:bg-primary/5 hover:text-primary',
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <SidebarAccountMenu
            userName={userName}
            roleLabel={getRoleLabel(role)}
            onProfile={() => goTo('/dashboard/profile')}
            onSettings={() => goTo('/dashboard/settings')}
            onSecurity={() => goTo('/dashboard/security')}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-white px-6 lg:px-8 shadow-sm">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {userName || 'Admin'}
            </h1>
            <p className="hidden text-xs text-muted-foreground font-medium sm:block mt-0.5">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell unreadCount={unreadCount} initialNotifications={recentNotifications} />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {userName?.[0]?.toUpperCase() ?? 'A'}
                </span>
                <div className="hidden min-w-0 flex-col text-left sm:flex">
                  <span className="truncate text-sm font-bold text-foreground">{userName || 'Administrator'}</span>
                  <span className="truncate text-xs text-muted-foreground">@{userEmail || 'admin'}</span>
                </div>
                <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-bold text-foreground">{userName || 'Administrator'}</p>
                  <p className="text-xs text-muted-foreground">@{userEmail || 'admin'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => goTo('/dashboard/profile')}>
                  <User className="h-4 w-4" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => goTo('/dashboard/settings')}>
                  <Settings className="h-4 w-4" /> Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
