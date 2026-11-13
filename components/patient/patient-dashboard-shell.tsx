'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronUp,
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

type SubmenuItem = { label: string; href: string; badge?: number };

function SubmenuTreeList({
  items,
  pathname,
  onNavigate,
  tone = 'dark',
}: {
  items: SubmenuItem[];
  pathname: string;
  onNavigate?: () => void;
  tone?: 'dark' | 'light';
}) {
  return (
    <ul className="mt-1.5 flex flex-col gap-1 pl-2">
      {items.map((sub, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;
        const isActive = pathname === sub.href;

        return (
          <li key={sub.href} className="relative flex h-9 items-center pl-7">
            <svg
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute left-0 top-0 h-9 w-7 overflow-visible',
                tone === 'dark' ? 'text-[#4A4935]' : 'text-stone-300',
              )}
              viewBox="0 0 28 36"
              fill="none"
            >
              <path
                d={`M 10 ${isFirst ? -6 : 0} V 8 Q 10 18 20 18 H 24`}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {!isLast && (
                <path d="M 10 8 V 40" stroke="currentColor" strokeWidth="1.5" />
              )}
            </svg>

            <Link
              href={sub.href}
              onClick={onNavigate}
              className={cn(
                'flex h-9 w-full items-center justify-between rounded-xl px-3 text-xs transition-colors',
                isActive
                  ? tone === 'dark'
                    ? 'bg-[#2C2B1A] font-bold text-white'
                    : 'bg-[var(--hafta-org-50)] font-bold text-[#181700]'
                  : tone === 'dark'
                    ? 'font-medium text-stone-400 hover:text-stone-200'
                    : 'font-medium text-stone-600 hover:bg-stone-100',
              )}
            >
              <span className="truncate">{sub.label}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                {sub.badge && sub.badge > 0 ? (
                  <span className="rounded-full bg-[var(--hafta-org-100)] px-1.5 py-0.5 text-[9px] font-bold text-[#181700]">
                    {sub.badge > 99 ? '99+' : sub.badge}
                  </span>
                ) : null}
                {isActive ? (
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      tone === 'dark' ? 'text-white/80' : 'text-[#181700]',
                    )}
                  />
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

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
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [groupSelection, setGroupSelection] = useState<{ pathname: string; id: string | null }>({
    pathname: '',
    id: null,
  });
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
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

  const navGroups = useMemo(() => getDashboardNavigation(role), [role]);

  const activeParentId = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (!item.children) continue;
        const key = item.href ?? item.label;
        if (item.children.some((child) => child.href === pathname)) return key;
      }
    }
    return null;
  }, [navGroups, pathname]);

  const openGroupId =
    groupSelection.pathname === pathname ? groupSelection.id : null;
  const effectiveOpenGroupId = openGroupId ?? activeParentId;
  const badgeCountFor = (href?: string) => {
    if (!href || !navCounts) return 0;
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
          'fixed inset-y-0 left-0 z-50 hidden md:flex flex-col bg-[#181700] text-white',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-[248px]',
          collapsed && 'overflow-visible',
        )}
      >
        {/* Floating Toggle Collapse Button */}
        <button
          type="button"
          aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          onClick={() => setCollapsedOverride(!collapsed)}
          className="hidden md:flex absolute -right-3 top-[26px] z-30 h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors hover:border-[var(--hafta-org-200)] hover:bg-[var(--hafta-org-50)] hover:text-[#181700]"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        {/* ── Header: Logo ── */}
        <div
          className={cn(
            'flex h-[80px] shrink-0 items-center border-b border-stone-800/80',
            collapsed ? 'justify-center px-2' : 'justify-center px-2 md:justify-between md:px-6'
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
            <div className={cn('min-w-0 flex-col', collapsed ? 'hidden' : 'hidden md:flex')}>
              <span className="truncate text-base font-bold leading-tight tracking-tight text-white">
                Hafta Fisioterapi
              </span>
              <span className="mt-0.5 truncate font-mono text-[11px] font-semibold uppercase leading-tight tracking-wider text-[var(--hafta-org-100)]">
                Portal {getRoleLabel(role)}
              </span>
            </div>
          </Link>
        </div>

        {/* ── Navigation List ── */}
        <nav
          className={cn(
            'flex-1 py-4 px-2.5 space-y-4',
            collapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden',
          )}
        >
          {navGroups.map((group, groupIndex) => {
            const visibleItems = group.items;
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <p className="mb-1.5 hidden px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400 md:block">
                    {group.label}
                  </p>
                )}
                {collapsed && groupIndex > 0 && (
                  <div className="mx-auto mb-2 h-px w-6 bg-stone-800" />
                )}

                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const key = item.href ?? item.label;
                    const children = item.children ?? [];
                    const active = item.href
                      ? isActive(item.href)
                      : children.some((child) => child.href && isActive(child.href));
                    const badge = item.href
                      ? badgeCountFor(item.href)
                      : children.reduce(
                          (total, child) => total + (child.href ? badgeCountFor(child.href) : 0),
                          0,
                        );
                    const hasActiveChild = children.some(
                      (child) => child.href === pathname,
                    );
                    const open = effectiveOpenGroupId === key;

                    if (children.length > 0) {
                      return (
                        <li
                          key={key}
                          className="relative"
                          onMouseEnter={() => collapsed && setHoveredGroupId(key)}
                          onMouseLeave={() => collapsed && setHoveredGroupId(null)}
                        >
                          <button
                            type="button"
                            aria-expanded={collapsed ? undefined : open}
                            aria-controls={collapsed ? undefined : `nav-menu-${key}`}
                            aria-label={item.label}
                            onClick={() => {
                              if (collapsed) {
                                setCollapsedOverride(false);
                                setGroupSelection({ pathname, id: key });
                              } else {
                                setGroupSelection({ pathname, id: open ? null : key });
                              }
                            }}
                            className={cn(
                              'cursor-pointer transition-all',
                              collapsed
                                ? cn(
                                    'mx-auto flex h-11 w-11 items-center justify-center rounded-xl p-0',
                                    hoveredGroupId === key || hasActiveChild
                                      ? 'bg-[#2A2918] text-white'
                                      : 'bg-transparent text-stone-400 hover:text-stone-200',
                                  )
                                : cn(
                                    'flex h-11 w-full items-center justify-between rounded-xl px-3.5 text-xs font-bold',
                                    open
                                      ? 'bg-[#2C2B1A] text-white'
                                      : 'bg-transparent text-stone-400 hover:text-stone-200',
                                  ),
                            )}
                          >
                            <div
                              className={cn(
                                'flex min-w-0 items-center gap-3',
                                collapsed ? 'justify-center' : 'justify-start',
                              )}
                            >
                              <item.icon
                                className={cn(
                                  'h-4.5 w-4.5 shrink-0',
                                  open || hasActiveChild
                                    ? 'text-[var(--hafta-org-100)]'
                                    : 'text-current',
                                )}
                              />
                              {!collapsed && (
                                <span className="truncate leading-none">{item.label}</span>
                              )}
                            </div>
                            {!collapsed && (
                              <div className="flex shrink-0 items-center gap-1.5">
                                {badge > 0 ? (
                                  <span className="rounded-full bg-[var(--hafta-org-100)] px-1.5 py-0.5 text-[9px] font-bold text-[#181700]">
                                    {badge > 99 ? '99+' : badge}
                                  </span>
                                ) : null}
                                {open ? (
                                  <ChevronUp className="h-4 w-4 text-stone-300" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-stone-300" />
                                )}
                              </div>
                            )}
                          </button>

                          <AnimatePresence initial={false}>
                            {!collapsed && open ? (
                              <motion.div
                                key={`submenu-${key}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <SubmenuTreeList
                                  items={children
                                    .filter((child) => child.href)
                                    .map((child) => ({
                                  label: child.label,
                                  href: child.href!,
                                  badge: badgeCountFor(child.href),
                                }))}
                                  pathname={pathname}
                                  onNavigate={() => {
                                    setCollapsedOverride(null);
                                  }}
                                />
                              </motion.div>
                            ) : null}
                          </AnimatePresence>

                          {/* Collapsed Mode: Floating Label + Tree Card */}
                          {collapsed && hoveredGroupId === key && (
                            <div className="absolute left-[calc(100%+8px)] top-1/2 z-[80] -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#2E2D1D] bg-[#181700] px-3 py-1 text-xs font-bold text-white shadow-lg">
                              {item.label}
                            </div>
                          )}
                          <AnimatePresence>
                            {collapsed && hoveredGroupId === key ? (
                              <motion.div
                                key={`floating-tree-${key}`}
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.16, ease: 'easeOut' }}
                                className="absolute left-3 top-[calc(100%+6px)] z-[80] w-52 rounded-2xl border border-[#2E2D1D] bg-[#181700] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                              >
                                <p className="px-1 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-stone-500">
                                  {item.label}
                                </p>
                                <SubmenuTreeList
                                  items={children
                                    .filter((child) => child.href)
                                    .map((child) => ({
                                  label: child.label,
                                  href: child.href!,
                                  badge: badgeCountFor(child.href),
                                }))}
                                  pathname={pathname}
                                  onNavigate={() => setHoveredGroupId(null)}
                                />
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </li>
                      );
                    }

                    return (
                      <li
                        key={key}
                        className="relative"
                        onMouseEnter={() => collapsed && setHoveredGroupId(key)}
                        onMouseLeave={() => collapsed && setHoveredGroupId(null)}
                      >
                        <Link
                          href={item.href ?? '#'}
                          className={cn(
                            'group flex items-center justify-between text-xs font-semibold transition-all duration-150',
                            collapsed
                              ? 'w-11 h-11 mx-auto justify-center rounded-xl p-0'
                              : cn('min-h-11 px-3 py-2.5 rounded-xl', badge > 0 && 'pr-10'),
                            active
                              ? 'bg-stone-900 text-white font-bold ring-1 ring-white/10'
                              : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                          )}
                        >
                          <div className={cn('flex min-w-0 items-center gap-3', collapsed ? 'w-full justify-center' : 'justify-center md:justify-start')}>
                            <item.icon
                              className={cn(
                                'h-4.5 w-4.5 shrink-0 transition-colors',
                                active ? 'text-[var(--hafta-org-100)]' : 'text-stone-400 group-hover:text-stone-200'
                              )}
                            />
                            {!collapsed && (
                              <span className="hidden truncate leading-none md:inline">{item.label}</span>
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
                                ? 'bg-[var(--hafta-org-100)] text-[#181700]'
                                : 'bg-white/10 text-white',
                            )}
                          >
                            {badge > 99 ? '99+' : badge}
                          </span>
                        ) : null}

                        {/* Collapsed Mode Popover */}
                        {collapsed && hoveredGroupId === key && (
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
        <div className={cn('border-t border-stone-800/80', collapsed ? 'p-2.5' : 'p-3 md:p-3.5')}>
          <button
            type="button"
            onClick={() => goTo('/dashboard/profile')}
            title={userName || 'Profil'}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-[var(--hafta-org-100)] transition-all hover:ring-2 hover:ring-[var(--hafta-org-100)] cursor-pointer md:hidden"
          >
              {liveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={liveAvatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                userName?.[0]?.toUpperCase() ?? 'P'
              )}
          </button>
          <div className={cn('items-center justify-between gap-2.5 rounded-2xl border border-stone-800/80 bg-stone-900/90 p-2.5', collapsed ? 'hidden' : 'hidden md:flex')}>
              <Link href="/dashboard/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-org-100)] text-xs font-bold text-[#181700]">
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
          collapsed ? 'md:pl-[68px]' : 'md:pl-[248px]'
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

            <Link href="/dashboard/profile" className="flex min-w-0 items-center gap-2.5 md:hidden">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-org-50)] text-sm font-bold text-[var(--hafta-org-900)] ring-1 ring-white/70">
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
                <DropdownMenuTrigger className="hidden items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-200)] md:flex">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-org-50)] text-sm font-bold text-[var(--hafta-org-900)]">
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
        <main
          data-role={role}
          className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28 lg:pb-10 overflow-x-clip"
        >
          {pathname !== '/dashboard' ? (
            <div className="pt-4 md:hidden">
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
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden"
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
                    active ? 'text-[var(--hafta-org-100)]' : 'text-white/60',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {badge > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--hafta-org-100)] px-1 text-[9px] font-bold leading-none text-[#181700]"
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    'text-[10px] transition-colors',
                    active
                      ? 'font-bold text-[var(--hafta-org-100)]'
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
                moreOpen ? 'text-[var(--hafta-org-100)]' : 'text-white/60',
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              {mobileMenuBadge > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--hafta-org-100)] px-1 text-[9px] font-bold leading-none text-[#181700]"
                >
                  {mobileMenuBadge > 99 ? '99+' : mobileMenuBadge}
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                'text-[10px] transition-colors',
                moreOpen
                  ? 'font-bold text-[var(--hafta-org-100)]'
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
                {group.items.map((item) => {
                  const children = item.children ?? [];
                  if (children.length > 0) {
                    const key = item.href ?? item.label;
                    const open = mobileOpenId === key;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setMobileOpenId(open ? null : key)}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-stone-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAFAF8] text-[#181700]">
                            <item.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1 text-sm font-semibold text-[#181700]">
                            {item.label}
                          </span>
                          {open ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-stone-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" />
                          )}
                        </button>
                        <AnimatePresence initial={false}>
                          {open ? (
                            <motion.div
                              key={`mobile-submenu-${key}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <SubmenuTreeList
                                items={children
                                  .filter((child) => child.href)
                                  .map((child) => ({
                                  label: child.label,
                                  href: child.href!,
                                  badge: badgeCountFor(child.href),
                                }))}
                                pathname={pathname}
                                onNavigate={() => setMoreOpen(false)}
                                tone="light"
                              />
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </li>
                    );
                  }

                  const badge = badgeCountFor(item.href);
                  return (
                    <li key={item.href ?? item.label}>
                      <Link
                        href={item.href ?? '#'}
                        onClick={() => setMoreOpen(false)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-stone-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAFAF8] text-[#181700]">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-semibold text-[#181700]">
                          {item.label}
                        </span>
                        {badge > 0 ? (
                          <span className="rounded-full bg-[var(--hafta-org-100)] px-2 py-0.5 text-[11px] font-extrabold text-[#181700]">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        ) : null}
                        <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                      </Link>
                    </li>
                  );
                })}
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
                    <Bell className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-[#181700]">
                    Notifikasi
                  </span>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-[var(--hafta-org-100)] px-2 py-0.5 text-[11px] font-extrabold text-[#181700]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
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
