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
}: {
  unreadCount?: number;
  initialNotifications?: NotificationView[];
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
        className="group relative h-10 w-10 rounded-full bg-stone-100 text-[#181700] hover:bg-stone-200/80 transition-colors cursor-pointer"
        aria-label="Buka notifikasi"
      >
        <Bell size={18} strokeWidth={2} aria-hidden="true" className="text-[#181700]" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[var(--hafta-red-500)] px-1 font-mono text-[10px] font-bold leading-none text-white shadow-xs">
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
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTab('all')}
                className={cn(
                  'rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer',
                  tab === 'all'
                    ? 'bg-[var(--hafta-ylw-100)] text-[#181700] shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                )}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTab('unread')}
                className={cn(
                  'rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer',
                  tab === 'unread'
                    ? 'bg-[var(--hafta-ylw-100)] text-[#181700] shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
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
        {/* Notification Items List */}
        <div className="divide-y divide-stone-100 -mx-1">
          {filtered.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center px-4 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-ylw-50)] text-[#181700]">
                <Bell className="h-6 w-6" />
              </div>
              <p className="mt-3 text-xs font-bold text-[#181700]">Tidak ada notifikasi</p>
              <p className="mt-1 max-w-xs text-[11px] text-stone-400">
                Semua notifikasi pembaruan jadwal dan klinis Anda akan muncul di sini.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = getNotificationIcon(item.title, item.message);
              return (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && markRead(item.id)}
                  className={cn(
                    'group relative flex items-start gap-3.5 p-3.5 rounded-2xl transition-colors cursor-pointer',
                    item.isRead ? 'hover:bg-stone-50' : 'bg-[#FEFEF6] hover:bg-stone-50/90'
                  )}
                >
                  {/* Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700 mt-0.5">
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  {/* Text Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-xs font-bold truncate', item.isRead ? 'text-stone-700' : 'text-[#181700]')}>
                        {item.title}
                      </p>
                      <span className="font-mono text-[10px] text-stone-400 shrink-0">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>

                    {item.message && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
                        {item.message}
                      </p>
                    )}

                    {item.actionUrl && (
                      <div className="mt-2.5">
                        <Link
                          href={item.actionUrl}
                          onClick={() => {
                            if (!item.isRead) markRead(item.id);
                            setOpen(false);
                          }}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#181700] hover:underline"
                        >
                          <span>Lihat Rincian</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Unread Dot Indicator */}
                  {!item.isRead && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--hafta-ylw-400)] mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </GlobalSlideOver>
    </>
  );
}
