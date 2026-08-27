"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAllNotificationsAsRead } from "@/server/actions/notifications";
import { cn } from "@/lib/utils";

export type NotificationView = {
  id: string;
  title: string;
  message: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};

const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

async function fetchNotifications(): Promise<{ notifications: NotificationView[]; unreadCount: number } | null> {
  try {
    const res = await fetch("/api/notifications", { cache: "no-store" });
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
  const [pending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [count, setCount] = useState(unreadCount);

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

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
  }

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

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative h-9 w-9 rounded-full focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
              className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-destructive shadow-sm"
            >
              <span className="sr-only">Notifikasi baru: {count}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[min(20rem,calc(100vw-2rem))] sm:w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {count > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {count} Baru
            </span>
          )}
        </DropdownMenuLabel>
        <div className="flex items-center justify-between gap-2 px-3 pb-2">
          {count > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAll} disabled={pending}>
              <CheckCheck className="h-4 w-4" aria-hidden="true" /> Tandai dibaca
            </Button>
          ) : (
            <span />
          )}
          <Link href="/dashboard/notifications" className="text-xs font-medium text-primary hover:underline">
            Lihat semua
          </Link>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Belum ada notifikasi
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-2">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-lg px-3 py-3 focus:bg-muted",
                    !notif.isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{notif.title}</span>
                    {!notif.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Belum dibaca" />
                    )}
                  </div>
                  {notif.message && (
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{notif.message}</p>
                  )}
                  <time className="text-[11px] text-muted-foreground/80" dateTime={notif.createdAt.toISOString()}>
                    {dateTimeFormat.format(notif.createdAt)}
                  </time>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <Link
          href="/dashboard/notifications"
          className="flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-medium text-primary hover:underline"
        >
          Buka halaman notifikasi <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
