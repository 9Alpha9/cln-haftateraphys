'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markAllNotificationsAsRead } from '@/server/actions/notifications';
import type { NotificationView } from '@/components/dashboard/notification-bell';
import { cn } from '@/lib/utils';

const dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function NotificationList({ items }: { items: NotificationView[] }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();
  const hasUnread = items.some((item) => !item.isRead);

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      setDone(true);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Semua Notifikasi</p>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={markAll} disabled={pending || done}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Tandai semua dibaca
          </Button>
        )}
      </div>
      <ul className="divide-y divide-border">
        {items.map((notif) => (
          <li
            key={notif.id}
            className={cn('flex flex-col gap-1 mx-4 px-4 py-3 mb-2 mt-2 rounded-md', !notif.isRead && 'bg-primary/5')}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{notif.title}</span>
              {!notif.isRead && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Belum dibaca" />
              )}
            </div>
            {notif.message ? (
              <p className="text-sm text-muted-foreground">{notif.message}</p>
            ) : null}
            <time className="text-xs text-muted-foreground/80" dateTime={notif.createdAt.toISOString()}>
              {dateTimeFormat.format(notif.createdAt)}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
