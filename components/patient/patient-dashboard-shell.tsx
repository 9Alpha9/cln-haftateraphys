'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Menu,
  ChevronDown,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardGlobalSearch } from '@/components/dashboard/dashboard-global-search';
import { cn } from '@/lib/utils';
import { getRoleLabel } from '@/lib/role-utils';
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

export function PatientDashboardShell({
  children,
  role,
  userName,
  userEmail,
  avatarUrl,
  unreadCount = 0,
  recentNotifications = [],
}: {
  children: React.ReactNode;
  role: Role;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
  unreadCount?: number;
  recentNotifications?: NotificationView[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updatedAvatar, setUpdatedAvatar] = useState<string | null>(null);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const liveAvatar = updatedAvatar ?? avatarUrl ?? null;

  useEffect(() => {
    function handleProfileUpdated(event: Event) {
      const customEvent = event as CustomEvent<{ avatarUrl?: string | null }>;
      if (typeof customEvent.detail?.avatarUrl !== 'undefined') {
        setUpdatedAvatar(customEvent.detail.avatarUrl ?? null);
      }
    }

    window.addEventListener('profile:updated', handleProfileUpdated);
    return () => window.removeEventListener('profile:updated', handleProfileUpdated);
  }, []);

  const navGroups = getDashboardNavigation(role);

  const goTo = (href: string) => {
    router.push(href);
    setSidebarOpen(false);
  };

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
    <div className="flex min-h-screen bg-[#F7FAF8]">
      {/* Backdrop Mobile Only */}
      <button
        type="button"
        aria-label="Tutup navigasi"
        className={cn('fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden', sidebarOpen ? 'block' : 'hidden')}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══ SIDEBAR (WeStud Dark Theme #181700) ═══ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#181700] text-white',
          'transition-all duration-300 ease-in-out',
          '-translate-x-full lg:translate-x-0',
          sidebarOpen && 'translate-x-0',
          collapsed ? 'lg:w-[68px]' : 'lg:w-[248px]',
          'w-[248px]'
        )}
      >
        {/* Floating Toggle Collapse Button */}
        <button
          type="button"
          aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex absolute -right-3 top-5 z-30 h-6 w-6 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm text-[#181700] hover:bg-[var(--hafta-ylw-100)] transition-all cursor-pointer"
        >
          {collapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
        </button>

        {/* ── Header: Logo ── */}
        <div
          className={cn(
            'flex h-[80px] shrink-0 items-center border-b border-stone-800/80',
            collapsed ? 'justify-center px-2' : 'justify-between px-6'
          )}
        >
          {!collapsed ? (
            <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
              <Image
                src="/images/logos/logos.png"
                alt="Hafta Fisioterapi"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 object-contain brightness-0 invert"
                priority
              />
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold tracking-tight text-white leading-tight truncate">
                  Hafta Fisioterapi
                </span>
                <span className="font-mono text-[11px] font-semibold text-[var(--hafta-ylw-100)] uppercase tracking-wider leading-tight truncate mt-0.5">
                  Portal Pasien
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center mx-auto" title="Hafta Fisioterapi">
              <Image
                src="/images/logos/logos.png"
                alt="Hafta Fisioterapi"
                width={36}
                height={36}
                className="h-9 w-9 object-contain brightness-0 invert"
                priority
              />
            </Link>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setSidebarOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-800 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Navigation List ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-4">
          {navGroups.map((group, groupIndex) => {
            const visibleItems = group.items;
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    {group.label}
                  </p>
                )}
                {collapsed && groupIndex > 0 && (
                  <div className="mx-auto mb-2 h-px w-6 bg-stone-800" />
                )}

                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const active = isActive(item.href);

                    return (
                      <li
                        key={item.href}
                        className="relative"
                        onMouseEnter={() => collapsed && setHoveredMenu(item.href)}
                        onMouseLeave={() => collapsed && setHoveredMenu(null)}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'group flex items-center justify-between text-xs font-semibold transition-all duration-150',
                            collapsed
                              ? 'w-11 h-11 mx-auto justify-center rounded-xl p-0'
                              : 'px-3 py-2.5 rounded-xl',
                            active
                              ? 'bg-[#2a2800] text-white font-bold border-l-3 border-[var(--hafta-ylw-100)] shadow-2xs'
                              : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                          )}
                        >
                          <div className={cn('flex items-center gap-3 min-w-0', collapsed && 'justify-center w-full')}>
                            <item.icon
                              className={cn(
                                'h-4.5 w-4.5 shrink-0 transition-colors',
                                active ? 'text-[var(--hafta-ylw-100)]' : 'text-stone-400 group-hover:text-stone-200'
                              )}
                            />
                            {!collapsed && <span className="truncate leading-none">{item.label}</span>}
                          </div>
                        </Link>

                        {/* Collapsed Mode Popover */}
                        {collapsed && hoveredMenu === item.href && (
                          <div className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl border border-stone-800 bg-[#181700] px-3 py-2 text-xs font-bold text-white shadow-2xl animate-in fade-in-50 duration-150">
                            <span>{item.label}</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* ── Footer: User Profile ── */}
        <div className={cn('border-t border-stone-800/80', collapsed ? 'p-2.5' : 'p-3.5')}>
          {collapsed ? (
            <button
              type="button"
              onClick={() => goTo('/dashboard/profile')}
              title={userName || 'Profil'}
              className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-[var(--hafta-ylw-100)] hover:ring-2 hover:ring-[var(--hafta-ylw-100)] transition-all cursor-pointer"
            >
              {liveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={liveAvatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                userName?.[0]?.toUpperCase() ?? 'P'
              )}
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-stone-900/90 p-2.5 border border-stone-800/80">
              <Link href="/dashboard/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-ylw-100)] text-xs font-bold text-[#181700]">
                  {liveAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={liveAvatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    userName?.[0]?.toUpperCase() ?? 'P'
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white leading-tight">{userName || 'Pasien'}</p>
                  <p className="truncate font-mono text-[10px] text-stone-400 mt-0.5">{getRoleLabel(role)}</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Keluar akun"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-[248px]'
        )}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-4 border-b border-stone-200/80 bg-white/90 backdrop-blur-md px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 shrink-0 text-[#181700]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <DashboardGlobalSearch role={role} />

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell unreadCount={unreadCount} initialNotifications={recentNotifications} />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-200)]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-ylw-50)] text-sm font-bold text-[var(--hafta-ylw-900)]">
                  {liveAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={liveAvatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    userName?.[0]?.toUpperCase() ?? 'P'
                  )}
                </span>
                <div className="hidden min-w-0 flex-col text-left sm:flex">
                  <span className="truncate text-xs font-bold text-[#111827]">{userName || 'Pasien'}</span>
                  <span className="truncate text-[11px] text-stone-500">{userEmail || 'pasien'}</span>
                </div>
                <ChevronDown className="hidden h-4 w-4 shrink-0 text-stone-400 sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-[#111827]">{userName || 'Pasien'}</p>
                  <p className="text-xs text-stone-500">{userEmail || 'pasien'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => goTo('/dashboard/profile')}>
                  Data Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => goTo('/dashboard/security')}>
                  Keamanan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-8 pb-12">{children}</main>
      </div>
    </div>
  );
}
