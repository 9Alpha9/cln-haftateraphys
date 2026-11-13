'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  FileText,
  ClipboardCheck,
  Mail,
  MessageSquareQuote,
  AlertCircle,
  CalendarDays,
  Users,
  Lock,
  ShieldCheck,
  Activity,
  LucideIcon,
  CheckCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bell as AnimatedBell } from '@/components/animate-ui/icons/bell';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/server/actions/notifications';
import { cn } from '@/lib/utils';

export type NotificationView = {
  id: string;
  title: string;
  message: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins}m lalu`;
  if (hours < 24) return `${hours}j lalu`;
  if (days < 7) return `${days}h lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function getNotificationIcon(title: string, message?: string | null): LucideIcon {
  const t = `${title} ${message ?? ''}`.toLowerCase();
  if (t.includes('janji') || t.includes('appointment') || t.includes('jadwal') || t.includes('sesi')) return CalendarDays;
  if (t.includes('intake') || t.includes('form awal') || t.includes('asesmen') || t.includes('evaluasi') || t.includes('rekam')) return ClipboardCheck;
  if (t.includes('pasien') || t.includes('patient') || t.includes('pengguna') || t.includes('user')) return Users;
  if (t.includes('katasandi') || t.includes('kata sandi') || t.includes('password') || t.includes('keamanan') || t.includes('sesi')) return Lock;
  if (t.includes('profil') || t.includes('diperbarui') || t.includes('verifikasi') || t.includes('akun')) return ShieldCheck;
  if (t.includes('progress') || t.includes('terapi') || t.includes('penanganan') || t.includes('layanan')) return Activity;
  if (t.includes('file') || t.includes('laporan') || t.includes('report') || t.includes('dokumen')) return FileText;
  if (t.includes('pesan') || t.includes('email') || t.includes('surat') || t.includes('notifikasi')) return Mail;
  if (t.includes('komentar') || t.includes('comment') || t.includes('catatan') || t.includes('pesan perbaikan')) return MessageSquareQuote;
  return AlertCircle;
}

export function NotificationBell({
  unreadCount = 0,
  initialNotifications = [],
  className,
}: {
  unreadCount?: number;
  initialNotifications?: NotificationView[];
  className?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationView[]>(initialNotifications);
  const [count, setCount] = useState(unreadCount);
  const [pending, startTransition] = useTransition();

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(
        data.notifications.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }))
      );
      setCount(data.unreadCount);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(refreshNotifications, 15000);
    return () => window.clearInterval(id);
  }, [refreshNotifications]);

  const isNotificationPage = pathname === '/dashboard/notifications';
  const isDrawerOpen = open && !isNotificationPage;

  function markAll() {
    startTransition(async () => {
      try {
        await markAllNotificationsAsRead();
        setCount(0);
        setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
      } catch {
        // ignore
      }
    });
  }

  function markRead(id: string) {
    startTransition(async () => {
      try {
        await markNotificationAsRead(id);
        setNotifications((current) => current.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setCount((prev) => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    });
  }

  const filtered = tab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <>
      {/* Topbar Bell Icon Button */}
      <Button
        size="icon"
        onClick={() => {
          if (pathname !== '/dashboard/notifications') setOpen(true);
        }}
        className={cn(
          'group relative h-11 w-11 cursor-pointer rounded-full text-[#181700] transition-all duration-300',
          className,
        )}
        aria-label="Buka notifikasi"
      >
        <AnimatedBell
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className="text-[#181700]"
          animate={count > 0}
          animateOnTap
          loop={count > 0}
          loopDelay={4000}
        />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[var(--hafta-red-500)] px-1 font-mono text-[10px] font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Button>

      {/* ── UNIFIED GLOBAL STATIC OVERLAY DRAWER ── */}
      <GlobalSlideOver
        isOpen={isDrawerOpen}
        onClose={() => setOpen(false)}
        size="sm"
        icon={<Bell className="h-5 w-5" />}
        title="Notifikasi"
        subtitle={`${count} pesan belum dibaca`}
        headerTabs={
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-[#F4F4F1] p-1">
              <button
                type="button"
                onClick={() => setTab('all')}
                className={cn(
                  'inline-flex h-9 cursor-pointer items-center rounded-full px-3.5 text-xs font-semibold transition-colors',
                  tab === 'all'
                    ? 'bg-[#181700] text-white'
                    : 'text-stone-500 hover:text-[#181700]'
                )}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTab('unread')}
                className={cn(
                  'inline-flex h-9 cursor-pointer items-center rounded-full px-3.5 text-xs font-semibold transition-colors',
                  tab === 'unread'
                    ? 'bg-[#181700] text-white'
                    : 'text-stone-500 hover:text-[#181700]'
                )}
              >
                Belum Dibaca
              </button>
            </div>

            {count > 0 && (
              <button
                type="button"
                onClick={markAll}
                disabled={pending}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 hover:text-[#181700] transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Tandai Semua</span>
              </button>
            )}
          </div>
        }
        footer={
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="text-xs font-bold text-[#181700] hover:underline"
          >
            Buka Halaman Notifikasi Lengkap &rarr;
          </Link>
        }
      >
        {/* Notification Items — flat list, minimal chrome */}
        <div>
          {filtered.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center px-4 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
                <Bell className="h-6 w-6" />
              </div>
              <p className="mt-3 text-xs font-bold text-[#181700]">Tidak ada notifikasi</p>
              <p className="mt-1 max-w-xs text-[11px] text-stone-400">
                Semua notifikasi pembaruan jadwal dan klinis Anda akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filtered.map((item) => {
                const Icon = getNotificationIcon(item.title, item.message);
                return (
                  <div
                    key={item.id}
                    onClick={() => !item.isRead && markRead(item.id)}
                    className={cn(
                      'group flex cursor-pointer items-start gap-2.5 py-3 first:pt-0 last:pb-0',
                      !item.isRead && 'hover:bg-stone-50/60',
                    )}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F7F4] text-stone-500">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'flex min-w-0 items-center gap-1.5 truncate text-[11px] leading-snug',
                            item.isRead ? 'font-medium text-stone-600' : 'font-bold text-[#181700]',
                          )}
                        >
                          {!item.isRead ? (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hafta-org-400)]" />
                          ) : null}
                          <span className="truncate">{item.title}</span>
                        </p>
                        <span className="shrink-0 whitespace-nowrap text-[10px] text-stone-400">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>

                      {item.message ? (
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-stone-500">
                          {item.message}
                        </p>
                      ) : null}

                      {item.actionUrl ? (
                        <Link
                          href={item.actionUrl}
                          onClick={() => {
                            if (!item.isRead) markRead(item.id);
                            setOpen(false);
                          }}
                          className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-stone-500 transition-colors hover:text-[#181700]"
                        >
                          <span>Lihat rincian</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlobalSlideOver>
    </>
  );
}
