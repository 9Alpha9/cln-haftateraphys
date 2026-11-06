'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getRoleLabel } from '@/lib/role-utils';
import { getDashboardNavigation } from '@/lib/permissions/dashboard-navigation';
import { signOut } from '@/lib/auth/client';
import { NotificationBell, type NotificationView } from '@/components/dashboard/notification-bell';
import { DashboardClock } from '@/components/dashboard/dashboard-clock';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SessionSecurityGuard } from '@/components/dashboard/session-security-guard';
import { LogoutConfirmModal } from '@/components/auth/logout-confirm-modal';
import type { Role } from '@/lib/permissions/roles';
import type { DashboardNavCounts } from '@/server/queries/nav-counts';

function subscribeToSidebarBreakpoint(callback: () => void) {
  const media = window.matchMedia('(max-width: 1279px)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getSidebarBreakpointSnapshot() {
  return window.matchMedia('(max-width: 1279px)').matches;
}

function getSidebarBreakpointServerSnapshot() {
  return false;
}

export function PatientDashboardShell({
  children,
  role,
  userName,
  userEmail,
  avatarUrl,
  unreadCount = 0,
  recentNotifications = [],
  navCounts,
}: {
  children: React.ReactNode;
  role: Role;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
  unreadCount?: number;
  recentNotifications?: NotificationView[];
  navCounts?: DashboardNavCounts;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const smallScreen = useSyncExternalStore(
    subscribeToSidebarBreakpoint,
    getSidebarBreakpointSnapshot,
    getSidebarBreakpointServerSnapshot,
  );
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
  const collapsed = collapsedOverride ?? smallScreen;
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [updatedAvatar, setUpdatedAvatar] = useState<string | null>(null);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navGroups = getDashboardNavigation(role);

  const badgeCountFor = (href: string) => {
    if (!navCounts) return 0;
    if (href === '/dashboard/patients') return navCounts.patients;
    if (href === '/dashboard/intake') return navCounts.intake;
    if (href === '/dashboard/progress') return navCounts.progressDrafts;
    return 0;
  };

  const mobileMenuBadge = navCounts?.progressDrafts ?? 0;

  const goTo = (href: string) => {
    router.push(href);
    setMoreOpen(false);
  };

  const performLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-[#F7FAF8]">
      {/* ═══ SIDEBAR (WeStud Dark Theme #181700) ═══ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col bg-[#181700] text-white',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'lg:w-[68px]' : 'lg:w-[248px]',
        )}
      >
        {/* Floating Toggle Collapse Button */}
        <button
          type="button"
          aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          onClick={() => setCollapsedOverride(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-5 z-30 h-6 w-6 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm text-[#181700] hover:bg-[var(--hafta-ylw-100)] transition-all cursor-pointer"
        >
          {collapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
        </button>

        {/* ── Header: Logo ── */}
        <div
          className={cn(
            'flex h-[80px] shrink-0 items-center border-b border-stone-800/80',
            collapsed ? 'justify-center px-2' : 'justify-center px-2 lg:justify-between lg:px-6'
          )}
        >
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3" title="Hafta Fisioterapi">
            <Image
              src="/images/logos/logos.png"
              alt="Hafta Fisioterapi"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain brightness-0 invert"
              priority
            />
            <div className={cn('min-w-0 flex-col', collapsed ? 'hidden' : 'hidden lg:flex')}>
              <span className="truncate text-base font-bold leading-tight tracking-tight text-white">
                Hafta Fisioterapi
              </span>
              <span className="mt-0.5 truncate font-mono text-[11px] font-semibold uppercase leading-tight tracking-wider text-[var(--hafta-ylw-100)]">
                Portal {getRoleLabel(role)}
              </span>
            </div>
          </Link>
        </div>

        {/* ── Navigation List ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-4">
          {navGroups.map((group, groupIndex) => {
            const visibleItems = group.items;
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <p className="mb-1.5 hidden px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400 lg:block">
                    {group.label}
                  </p>
                )}
                {collapsed && groupIndex > 0 && (
                  <div className="mx-auto mb-2 h-px w-6 bg-stone-800" />
                )}

                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const active = isActive(item.href);
                    const badge = badgeCountFor(item.href);

                    return (
                      <li
                        key={item.href}
                        className="relative"
                        onMouseEnter={() => collapsed && setHoveredMenu(item.href)}
                        onMouseLeave={() => collapsed && setHoveredMenu(null)}
                      >
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex items-center justify-between text-xs font-semibold transition-all duration-150',
                            collapsed
                              ? 'w-11 h-11 mx-auto justify-center rounded-xl p-0'
                              : cn('min-h-11 px-3 py-2.5 rounded-xl', badge > 0 && 'pr-10'),
                            active
                              ? 'bg-stone-900 text-white font-bold shadow-2xs ring-1 ring-white/10'
                              : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                          )}
                        >
                          <div className={cn('flex min-w-0 items-center gap-3', collapsed ? 'w-full justify-center' : 'justify-center lg:justify-start')}>
                            <item.icon
                              className={cn(
                                'h-4.5 w-4.5 shrink-0 transition-colors',
                                active ? 'text-[var(--hafta-ylw-100)]' : 'text-stone-400 group-hover:text-stone-200'
                              )}
                            />
                            {!collapsed && (
                              <span className="hidden truncate leading-none lg:inline">{item.label}</span>
                            )}
                          </div>
                        </Link>

                        {badge > 0 ? (
                          <span
                            aria-label={`${badge} ${
                              item.href === '/dashboard/patients'
                                ? 'pasien'
                                : item.href === '/dashboard/intake'
                                  ? 'intake menunggu'
                                  : 'draft rekam medis'
                            }`}
                            className={cn(
                              'pointer-events-none absolute z-10 flex items-center justify-center rounded-full font-bold',
                              collapsed
                                ? 'right-1 top-1 h-4 min-w-4 px-1 text-[9px]'
                                : 'right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px]',
                              collapsed || item.href === '/dashboard/intake'
                                ? 'bg-[var(--hafta-ylw-100)] text-[#181700]'
                                : 'bg-white/10 text-white',
                            )}
                          >
                            {badge > 99 ? '99+' : badge}
                          </span>
                        ) : null}

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
        <div className={cn('border-t border-stone-800/80', collapsed ? 'p-2.5' : 'p-3 lg:p-3.5')}>
          <button
            type="button"
            onClick={() => goTo('/dashboard/profile')}
            title={userName || 'Profil'}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-[var(--hafta-ylw-100)] transition-all hover:ring-2 hover:ring-[var(--hafta-ylw-100)] cursor-pointer lg:hidden"
          >
              {liveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={liveAvatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                userName?.[0]?.toUpperCase() ?? 'P'
              )}
          </button>
          <div className={cn('items-center justify-between gap-2.5 rounded-2xl border border-stone-800/80 bg-stone-900/90 p-2.5', collapsed ? 'hidden' : 'hidden lg:flex')}>
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
        <header className="sticky top-0 z-30">
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+1.25rem)] border-b border-stone-200/70 bg-white/80 transition-opacity duration-300 ease-out',
              scrolled ? 'opacity-100' : 'opacity-0',
            )}
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              maskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)',
            }}
          />
          <div className="relative z-10 mx-auto flex h-[68px] w-full max-w-[1600px] items-center gap-3 px-3 sm:px-6 lg:px-8">
            <div className="hidden shrink-0 sm:block">
              <DashboardClock />
            </div>

            <Link href="/dashboard/profile" className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-ylw-50)] text-sm font-bold text-[var(--hafta-ylw-900)] ring-1 ring-white/70">
                {liveAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={liveAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  userName?.[0]?.toUpperCase() ?? 'P'
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold leading-tight text-[#111827]">
                  {userName || 'Pasien'}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-medium leading-tight text-stone-500">
                  {getRoleLabel(role)}
                </span>
              </span>
            </Link>


            <div className="ml-auto flex shrink-0 items-center gap-2.5">
              <NotificationBell
                unreadCount={unreadCount}
                initialNotifications={recentNotifications}
                className={cn(
                  scrolled
                    ? 'bg-transparent hover:bg-stone-100/70'
                    : 'border border-white/60 bg-white/60 shadow-[0_4px_16px_rgba(24,23,0,0.08)] backdrop-blur-md hover:bg-white/80',
                )}
              />

              <DropdownMenu>
                <DropdownMenuTrigger className="hidden items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-200)] lg:flex">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28 lg:pb-10 overflow-x-clip">
          {pathname !== '/dashboard' ? (
            <div className="pt-4 lg:hidden">
              <button
                type="button"
                aria-label="Kembali"
                onClick={() => router.back()}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-[#181700] transition-colors hover:bg-stone-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          {children}
        </main>

        {/* Session Security Guard */}
        <SessionSecurityGuard role={role} userId={userEmail ?? 'unknown'} />

        {/* Logout Confirmation Modal */}
        <LogoutConfirmModal
          isOpen={logoutModalOpen}
          onConfirm={performLogout}
          onCancel={() => setLogoutModalOpen(false)}
        />
      </div>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-[26px] border border-white/15 bg-[#181700]/90 px-2 py-2 shadow-[0_10px_30px_rgba(24,23,0,0.28)] backdrop-blur-xl">
          {(role === 'USER'
            ? [
                { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
                { href: '/dashboard/appointments', label: 'Jadwal', icon: CalendarDays },
                { href: '/dashboard/progress', label: 'Progres', icon: TrendingUp },
                { href: '/dashboard/history', label: 'Catatan', icon: FileText },
              ]
            : [
                { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
                { href: '/dashboard/appointments', label: 'Jadwal', icon: CalendarDays },
                { href: '/dashboard/patients', label: 'Pasien', icon: Users },
                { href: '/dashboard/intake', label: 'Intake', icon: ClipboardList },
              ]
          ).map(({ href, label, icon: Icon }) => {
            const active =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === href || pathname.startsWith(`${href}/`);
            const badge = badgeCountFor(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-0.5"
              >
                <span
                  className={cn(
                    'relative flex h-8 w-11 items-center justify-center rounded-full transition-colors',
                    active ? 'text-[var(--hafta-ylw-100)]' : 'text-white/60',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {badge > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] px-1 text-[9px] font-bold leading-none text-[#181700]"
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    'text-[10px] transition-colors',
                    active
                      ? 'font-bold text-[var(--hafta-ylw-100)]'
                      : 'font-semibold text-white/60',
                  )}
                >
                  {label}
                </span>
                {badge > 0 ? (
                  <span className="sr-only">
                    , {badge}{' '}
                    {href === '/dashboard/patients'
                      ? 'pasien'
                      : href === '/dashboard/intake'
                        ? 'intake menunggu'
                        : 'draft rekam medis'}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className="flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-2xl py-0.5"
          >
            <span
              className={cn(
                'relative flex h-8 w-11 items-center justify-center rounded-full transition-colors',
                moreOpen ? 'text-[var(--hafta-ylw-100)]' : 'text-white/60',
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              {mobileMenuBadge > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] px-1 text-[9px] font-bold leading-none text-[#181700]"
                >
                  {mobileMenuBadge > 99 ? '99+' : mobileMenuBadge}
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                'text-[10px] transition-colors',
                moreOpen
                  ? 'font-bold text-[var(--hafta-ylw-100)]'
                  : 'font-semibold text-white/60',
              )}
            >
              Menu
            </span>
            {mobileMenuBadge > 0 ? (
              <span className="sr-only">, {mobileMenuBadge} draft rekam medis</span>
            ) : null}
          </button>
        </div>
      </nav>

      <GlobalSlideOver
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        size="sm"
        zIndexBase={60}
        icon={
          liveAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={liveAvatar} alt="Foto profil" className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-bold">{userName?.[0]?.toUpperCase() ?? 'P'}</span>
          )
        }
        title={userName || 'Pasien'}
        subtitle={getRoleLabel(role)}
        footer={
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              handleLogout();
            }}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-red-200 bg-white text-xs font-bold text-red-700 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Keluar akun
          </button>
        }
      >
        <nav className="space-y-4 sm:space-y-5" aria-label="Menu akun">
          {navGroups
            .filter((group) => group.items.length > 0)
            .map((group) => (
            <div key={group.label}>
              <p className="px-1 font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {group.label}
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-stone-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAFAF8] text-[#181700]">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-semibold text-[#181700]">
                        {item.label}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="px-1 font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Lainnya
            </p>
            <ul className="mt-1.5 space-y-1.5">
              <li>
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setMoreOpen(false)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-stone-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAFAF8] text-[#181700]">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-[#181700]">
                    Notifikasi
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </GlobalSlideOver>
    </div>
  );
}
