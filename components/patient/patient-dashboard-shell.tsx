'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Menu,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarAccountMenu } from '@/components/dashboard/sidebar-account-menu';
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

const SIDEBAR_FULL = 240;
const SIDEBAR_COLLAPSED = 64;

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [liveAvatar, setLiveAvatar] = useState<string | null>(avatarUrl ?? null);

  useEffect(() => setLiveAvatar(avatarUrl ?? null), [avatarUrl]);
  useEffect(() => {
    const h = (e: Event) => setLiveAvatar((e as CustomEvent).detail?.avatarUrl ?? null);
    window.addEventListener('hafta:avatar', h as EventListener);
    return () => window.removeEventListener('hafta:avatar', h as EventListener);
  }, []);

  const navGroups = getDashboardNavigation(role);
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

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;

  return (
    <div className="flex min-h-screen bg-[#F7FAF8]">
      {/* Backdrop — mobile only */}
      <button
        type="button"
        aria-label="Tutup navigasi"
        className={cn('fixed inset-0 z-40 bg-black/30 lg:hidden', sidebarOpen ? 'block' : 'hidden')}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-[#F1F5F9]',
          'transition-all duration-200 ease-in-out',
          // Mobile: slide in/out
          '-translate-x-full lg:translate-x-0',
          sidebarOpen && 'translate-x-0',
          // Desktop width
          collapsed ? 'lg:w-[64px]' : 'lg:w-[240px]',
          // Mobile always full width
          'w-[240px]',
        )}
      >
        {/* ── Header: Logo + close buttons ── */}
        <div className={cn(
          'flex h-[64px] shrink-0 items-center border-b border-[#F1F5F9]',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <Image
                src="/images/logos/logos.png"
                alt="Hafta Fisioterapi"
                width={32}
                height={32}
                className="h-8 w-8 object-contain shrink-0"
                priority
                unoptimized
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-[#111827] leading-tight truncate">Hafta Fisioterapi</span>
                <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider leading-tight truncate">Portal Pasien</span>
              </div>
            </Link>
          )}

          {collapsed && (
            <Link href="/dashboard" className="flex items-center justify-center">
              <Image
                src="/images/logos/logos.png"
                alt="Hafta Fisioterapi"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
                unoptimized
              />
            </Link>
          )}

          {/* Desktop collapse toggle */}
          <button
            type="button"
            aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F1F5F9] hover:text-[#374151]',
              collapsed && 'mx-auto',
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setSidebarOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F1F5F9] hover:text-[#374151] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {navGroups.map((group, groupIndex) => {
            const visibleItems = group.items;
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label} className={cn('mb-3', groupIndex > 0 && 'mt-5')}>
                {!collapsed && (
                  <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-[#C4B5A0]">
                    {group.label}
                  </p>
                )}
                {collapsed && groupIndex > 0 && (
                  <div className="mx-auto mb-2 h-px w-8 bg-[#F1F5F9]" />
                )}
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          title={collapsed ? item.label : undefined}
                            className={cn(
                            'flex min-h-[40px] items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150',
                            collapsed ? 'justify-center px-2' : 'px-3',
                            active
                              ? 'bg-gradient-to-r from-hafta-ylw-100 via-hafta-ylw-50 to-transparent text-hafta-ylw-900 font-semibold'
                              : 'text-[#6B7280] hover:bg-[#F7FAF8] hover:text-[#111827]',
                          )}
                        >
                          <item.icon
                            className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]', active ? 'text-hafta-ylw-600' : 'text-[#9CA3AF]')}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* ── Motivational card — hanya saat sidebar expanded ── */}
        {!collapsed && (
          <div className="mx-3 mb-3 overflow-hidden rounded-xl bg-[var(--hafta-ylw-50)]">
            <div className="relative h-20 w-full overflow-hidden">
              <Image
                src="/images/models/model-patient-3.png"
                alt=""
                fill
                className="object-cover object-top"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[var(--hafta-ylw-50)] to-transparent" />
            </div>
            <div className="px-3 pb-3">
              <p className="text-[11px] font-medium text-[var(--hafta-ylw-900)] leading-relaxed">
                Bersama membantu setiap langkah menuju pemulihan.
              </p>
            </div>
          </div>
        )}

        {/* ── User profile ── */}
        <div className={cn('border-t border-[#F1F5F9]', collapsed ? 'p-2' : 'p-3')}>
          {collapsed ? (
            // Collapsed: avatar hanya
            <button
              type="button"
              onClick={() => goTo('/dashboard/profile')}
              title={userName || 'Profil Pasien'}
              className="flex h-10 w-10 mx-auto items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-ylw-50)] text-sm font-bold text-[var(--hafta-ylw-900)] transition-opacity hover:opacity-80"
            >
              {liveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={liveAvatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{userName?.[0]?.toUpperCase() ?? 'P'}</span>
              )}
            </button>
          ) : (
            <SidebarAccountMenu
              userName={userName}
              roleLabel={getRoleLabel(role)}
              avatarUrl={liveAvatar}
              onProfile={() => goTo('/dashboard/profile')}
              onSettings={() => goTo('/dashboard/settings')}
              onSecurity={() => goTo('/dashboard/security')}
              onLogout={handleLogout}
            />
          )}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-all duration-200 ease-in-out',
          collapsed ? 'lg:pl-[64px]' : 'lg:pl-[240px]',
        )}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-[64px] items-center gap-4 border-b border-[#F1F5F9] bg-white/80 backdrop-blur-md px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-lg items-center gap-2 rounded-xl border border-[#F1F5F9] bg-[#F7FAF8] px-4 py-2 transition-colors focus-within:border-[var(--hafta-ylw-200)] focus-within:bg-white">
            <Search className="h-4 w-4 text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              placeholder="Cari sesi atau jadwal terapi..."
              className="flex-1 bg-transparent text-[13px] text-[#111827] placeholder:text-[#9CA3AF] outline-none"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1.5 text-[10px] font-medium text-[#9CA3AF]">
              ⌘K
            </kbd>
          </div>

          {/* Right section */}
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell unreadCount={unreadCount} initialNotifications={recentNotifications} />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-200)]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-ylw-50)] text-sm font-bold text-[var(--hafta-ylw-900)]">
                  {liveAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={liveAvatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    (userName?.[0]?.toUpperCase() ?? 'P')
                  )}
                </span>
                <div className="hidden min-w-0 flex-col text-left sm:flex">
                  <span className="truncate text-[13px] font-semibold text-[#111827]">{userName || 'Pasien'}</span>
                  <span className="truncate text-[11px] text-[#6B7280]">@{userEmail || 'pasien'}</span>
                </div>
                <ChevronDown className="hidden h-4 w-4 shrink-0 text-[#9CA3AF] sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-[#111827]">{userName || 'Pasien'}</p>
                  <p className="text-xs text-[#6B7280]">@{userEmail || 'pasien'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => goTo('/dashboard/profile')}>
                  <Settings className="h-4 w-4" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => goTo('/dashboard/settings')}>
                  <Settings className="h-4 w-4" /> Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-[#dc2626] focus:text-[#dc2626]">
                  <LogOut className="h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
