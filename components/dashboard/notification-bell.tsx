'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SlideDrawer } from '@/components/ui/slide-drawer';
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
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
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
  if (t.includes('system') || t.includes('alert') || t.includes('peringatan') || t.includes('error')) return AlertCircle;
  return Bell;
}

async function fetchNotifications(): Promise<{ notifications: NotificationView[]; unreadCount: number } | null> {
  try {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      notifications: data.notifications.map((n: Record<string, unknown>) => ({
        ...n,
        createdAt: new Date(n.createdAt as string),
      })),
      unreadCount: data.unreadCount as number,
    };
  } catch {
    return null;
  }
}

export function NotificationBell({
  unreadCount,
  initialNotifications,
}: {
  unreadCount: number;
  initialNotifications: NotificationView[];
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [count, setCount] = useState(unreadCount);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [open, setOpen] = useState(false);

  const refreshNotifications = useCallback(async () => {
    const data = await fetchNotifications();
    if (data) {
      setNotifications(data.notifications);
      setCount(data.unreadCount);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(refreshNotifications, 15000);
    return () => window.clearInterval(id);
  }, [refreshNotifications]);

  useEffect(() => {
    if (pathname === '/dashboard/notifications') {
      setOpen(false);
    }
  }, [pathname]);

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
      <Button
        size="icon"
        onClick={() => {
          if (pathname !== '/dashboard/notifications') setOpen(true);
        }}
        className="group relative h-10 w-10 rounded-full bg-hafta-ylw-100 transition-all hover:bg-hafta-ylw-200"
        aria-label="Open notifications"
      >
        <Bell
          size={20}
          strokeWidth={2.28}
          aria-hidden="true"
          className="text-hafta-red-800 transition-colors group-hover:text-hafta-red-800"
        />
        {count > 0 && (
          <span className="absolute -top-1.5 left-full flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-hafta-red-800 px-1 text-[10px] font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Button>

      <SlideDrawer
        open={open && pathname !== '/dashboard/notifications'}
        onClose={() => setOpen(false)}
        closeOnOutsideClick={false}
        overlayClassName="bg-transparent backdrop-blur-none"
        width="w-[min(100vw,24rem)] rounded-tl-2xl rounded-bl-2xl"
        title={
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-hafta-ylw-100 text-hafta-red-800">
              <Bell className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-hafta-ylw-900">Notifications</p>
              <p className="text-[11px] text-gray-500">{count} belum dibaca</p>
            </div>
          </>
        }
        headerRight={
          count > 0 && (
            <button
              onClick={markAll}
              disabled={pending}
              className="text-[11px] cursor-pointer font-bold text-hafta-ylw-800 transition-colors hover:text-hafta-ylw-900"
            >
              Tandai Semua Dibaca
            </button>
          )
        }
      >
        <div className="border-b border-[#E5E7EB] px-4 py-3 sm:px-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('all')}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
                tab === 'all'
                  ? 'bg-hafta-ylw-100 text-hafta-ylw-900'
                  : 'bg-[#F7FAF8] text-[#6B7280] hover:bg-[#EEF2F7] cursor-pointer'
              )}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setTab('unread')}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
                tab === 'unread'
                  ? 'bg-hafta-ylw-100 text-hafta-ylw-900'
                  : 'bg-[#F7FAF8] text-[#6B7280] hover:bg-[#EEF2F7] cursor-pointer'
              )}
            >
              Belum Dibaca
            </button>
          </div>
        </div>

        <div className="py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          {filtered.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hafta-ylw-50 text-hafta-ylw-700">
                <Bell className="h-6 w-6" />
              </div>
              <p className="mt-3 text-[13px] font-bold text-[#111827]">Tidak ada notifikasi</p>
              <p className="mt-1 max-w-xs text-[12px] text-[#9CA3AF]">Semua notifikasi akan muncul di sini ketika ada pembaruan.</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
              className="flex flex-col"
            >
              {filtered.map((n) => {
                const Icon = getNotificationIcon(n.title, n.message);
                return (
                  <motion.div
                    key={n.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <div
                      onClick={() => {
                        if (!n.isRead) markRead(n.id);
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 bg-white px-4 py-4 text-left transition-colors hover:bg-gray-100 cursor-pointer',
                        !n.isRead && 'bg-white'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          !n.isRead ? 'bg-[#F8FAFC] text-[#64748B]' : 'bg-[#F8FAFC] text-[#9CA3AF]'
                        )}
                      >
                        <Icon size={16} strokeWidth={2.25} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-[13px] leading-snug', !n.isRead ? 'font-bold text-[#111827]' : 'font-medium text-[#374151]')}>
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280] whitespace-pre-line">
                                {n.message}
                              </p>
                            )}
                          </div>
                          {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-hafta-grn-500" />}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <time className="text-[11px] font-medium text-[#9CA3AF]" dateTime={n.createdAt.toISOString()}>
                            {timeAgo(n.createdAt)}
                          </time>
                          {n.actionUrl && (
                            <div className="flex items-center gap-2">
                              <Link
                                href={n.actionUrl}
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#374151] transition-colors hover:text-[#111827]"
                              >
                                Lihat <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </SlideDrawer>
    </>
  );
}
