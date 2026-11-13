'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  CalendarDays,
  ClipboardCheck,
  Users,
  Lock,
  ShieldCheck,
  Activity,
  FileText,
  Mail,
  MessageSquareQuote,
  AlertCircle,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/server/actions/notifications';
import type { NotificationView } from '@/components/dashboard/notification-bell';
import { cn } from '@/lib/utils';

const dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

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

export function NotificationList({ items }: { items: NotificationView[] }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [list, setList] = useState(items);
  const router = useRouter();

  const hasUnread = list.some((item) => !item.isRead);

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      setDone(true);
      setList((prev) => prev.map((item) => ({ ...item, isRead: true })));
      router.refresh();
    });
  }

  function markSingle(id: string) {
    startTransition(async () => {
      await markNotificationAsRead(id);
      setList((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      router.refresh();
    });
  }

  const filteredItems = filter === 'unread' ? list.filter((item) => !item.isRead) : list;

  return (
    <div>
      {/* Top Bar Filter + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200/80 px-4 sm:px-5 py-3.5 gap-3 bg-white">
        <div className="inline-flex items-center gap-1 self-start rounded-full bg-[#F4F4F1] p-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'inline-flex h-9 cursor-pointer items-center justify-center rounded-full px-3.5 text-xs font-semibold transition-all',
              filter === 'all'
                ? 'bg-[#181700] text-white'
                : 'text-stone-500 hover:bg-white/60 hover:text-[#181700]'
            )}
          >
            Semua ({list.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={cn(
              'inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all',
              filter === 'unread'
                ? 'bg-[#181700] text-white'
                : 'text-stone-500 hover:bg-white/60 hover:text-[#181700]'
            )}
          >
            Belum Dibaca
            {hasUnread && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#181700] px-1 text-[10px] font-bold text-white">
                {list.filter((i) => !i.isRead).length}
              </span>
            )}
          </button>
        </div>

        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAll}
            disabled={pending || done}
            className="rounded-xl border-stone-200/90 text-[12px] font-semibold text-hafta-org-900 hover:bg-hafta-org-50 hover:text-hafta-org-900"
          >
            <CheckCheck className="h-4 w-4 text-hafta-org-700" aria-hidden="true" />
            Tandai semua dibaca
          </Button>
        )}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="py-8 sm:py-12 text-center text-[13px] text-stone-500 font-medium">
          {filter === 'unread' ? 'Tidak ada notifikasi yang belum dibaca.' : 'Tidak ada notifikasi.'}
        </div>
      ) : (
        <ul className="space-y-3 p-3.5 sm:p-4">
          {filteredItems.map((notif) => {
            const Icon = getNotificationIcon(notif.title, notif.message);
            return (
              <li
                key={notif.id}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-3.5 transition-colors sm:gap-3.5 sm:p-4',
                  !notif.isRead
                    ? 'border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)]/35'
                    : 'border-stone-200/70 bg-white hover:bg-[#FBFBFA]'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                    !notif.isRead
                      ? 'bg-stone-50 text-stone-500'
                      : 'bg-stone-50 text-stone-400'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn('text-[13px] leading-snug', !notif.isRead ? 'font-bold text-[#181700]' : 'font-medium text-stone-700')}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500 whitespace-pre-line">
                          {notif.message}
                        </p>
                      )}
                    </div>

                    {!notif.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-hafta-grn-500" aria-label="Belum dibaca" />}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <time className="text-[11px] font-medium text-stone-400" dateTime={notif.createdAt.toISOString()}>
                      {timeAgo(notif.createdAt)}
                    </time>

                    <div className="flex items-center gap-3">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={() => markSingle(notif.id)}
                          className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 transition-colors"
                        >
                          Tandai dibaca
                        </button>
                      )}

                      {notif.actionUrl && (
                        <Link
                          href={notif.actionUrl}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-700 transition-colors hover:text-[#181700]"
                        >
                          Lihat <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
