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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5E7EB] px-5 py-3.5 gap-3 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all',
              filter === 'all'
                ? 'bg-hafta-ylw-200 text-hafta-ylw-900 shadow-xs'
                : 'text-[#6B7280] hover:bg-[#F1F5F9] hover:text-[#111827]'
            )}
          >
            Semua ({list.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all flex items-center gap-1.5',
              filter === 'unread'
                ? 'bg-hafta-ylw-200 text-hafta-ylw-900 shadow-xs'
                : 'text-[#6B7280] hover:bg-[#F1F5F9] hover:text-[#111827]'
            )}
          >
            Belum Dibaca
            {hasUnread && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-hafta-ylw-600 px-1 text-[10px] font-bold text-white">
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
            className="rounded-xl border-[#E5E7EB] text-[12px] font-semibold text-hafta-ylw-900 hover:bg-hafta-ylw-50 hover:text-hafta-ylw-900"
          >
            <CheckCheck className="h-4 w-4 text-hafta-ylw-700" aria-hidden="true" />
            Tandai semua dibaca
          </Button>
        )}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-[#6B7280] font-medium">
          {filter === 'unread' ? 'Tidak ada notifikasi yang belum dibaca.' : 'Tidak ada notifikasi.'}
        </div>
      ) : (
        <ul className="divide-y divide-[#F1F5F9]">
          {filteredItems.map((notif) => {
            const Icon = getNotificationIcon(notif.title, notif.message);
            return (
              <li
                key={notif.id}
                className={cn(
                  'flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-[#F8FAFC]',
                  !notif.isRead && 'bg-white'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                    !notif.isRead
                      ? 'bg-[#F8FAFC] text-[#64748B]'
                      : 'bg-[#F8FAFC] text-[#9CA3AF]'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn('text-[13px] leading-snug', !notif.isRead ? 'font-bold text-[#111827]' : 'font-medium text-[#374151]')}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280] whitespace-pre-line">
                          {notif.message}
                        </p>
                      )}
                    </div>

                    {!notif.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-hafta-grn-500" aria-label="Belum dibaca" />}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <time className="text-[11px] font-medium text-[#9CA3AF]" dateTime={notif.createdAt.toISOString()}>
                      {timeAgo(notif.createdAt)}
                    </time>

                    <div className="flex items-center gap-3">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={() => markSingle(notif.id)}
                          className="text-[11px] font-semibold text-[#9CA3AF] hover:text-[#374151] transition-colors"
                        >
                          Tandai dibaca
                        </button>
                      )}

                      {notif.actionUrl && (
                        <Link
                          href={notif.actionUrl}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#374151] transition-colors hover:text-[#111827]"
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
