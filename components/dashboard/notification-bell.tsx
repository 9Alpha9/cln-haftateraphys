"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/server/actions/notifications";
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

function getNotificationIcon(title: string, message?: string | null): LucideIcon {
  const t = `${title} ${message ?? ''}`.toLowerCase();
  if (t.includes("janji") || t.includes("appointment") || t.includes("jadwal") || t.includes("sesi")) return CalendarDays;
  if (t.includes("intake") || t.includes("form awal") || t.includes("asesmen") || t.includes("evaluasi") || t.includes("rekam")) return ClipboardCheck;
  if (t.includes("pasien") || t.includes("patient") || t.includes("pengguna") || t.includes("user")) return Users;
  if (t.includes("katasandi") || t.includes("kata sandi") || t.includes("password") || t.includes("keamanan") || t.includes("sesi")) return Lock;
  if (t.includes("profil") || t.includes("diperbarui") || t.includes("verifikasi") || t.includes("akun")) return ShieldCheck;
  if (t.includes("progress") || t.includes("terapi") || t.includes("penanganan") || t.includes("layanan")) return Activity;
  if (t.includes("file") || t.includes("laporan") || t.includes("report") || t.includes("dokumen")) return FileText;
  if (t.includes("pesan") || t.includes("email") || t.includes("surat") || t.includes("notifikasi")) return Mail;
  if (t.includes("komentar") || t.includes("comment") || t.includes("catatan") || t.includes("pesan perbaikan")) return MessageSquareQuote;
  if (t.includes("system") || t.includes("alert") || t.includes("peringatan") || t.includes("error")) return AlertCircle;
  return Bell;
}

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
  const [notifications, setNotifications] = useState(initialNotifications);
  const [count, setCount] = useState(unreadCount);
  const [tab, setTab] = useState("all");

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

  const filtered = tab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline" className="relative h-9 w-9 rounded-xl border border-border/80 bg-card shadow-2xs" aria-label="Open notifications">
          <Bell size={16} strokeWidth={2} aria-hidden="true" className="text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-1.5 left-full flex h-5 min-h-5 min-w-5 -translate-x-1/2 items-center justify-center rounded-full border border-white bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground shadow-sm">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 border border-border bg-card shadow-lg" align="end" showArrow={false}>
        <Tabs value={tab} onValueChange={setTab}>
          {/* Header with Tabs + Mark All */}
          <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
            <TabsList className="bg-accent/10 border border-accent/20 rounded-full p-1">
              <TabsTrigger value="all" className="rounded-full text-xs font-semibold py-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm">Semua</TabsTrigger>
              <TabsTrigger value="unread" className="rounded-full text-xs font-semibold py-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm">
                Belum Dibaca {count > 0 && <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground data-[state=active]:bg-white data-[state=active]:text-[#92400e]">{count > 99 ? "99+" : count}</span>}
              </TabsTrigger>
            </TabsList>
            {count > 0 && (
              <button
                onClick={markAll}
                disabled={pending}
                className="text-xs font-bold text-[#92400e] hover:underline cursor-pointer disabled:opacity-50"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground font-medium">
                Tidak ada notifikasi
              </div>
            ) : (
              filtered.map((n) => {
                const Icon = getNotificationIcon(n.title, n.message);
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border/30 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 cursor-pointer",
                      !n.isRead && "bg-accent/[0.04]"
                    )}
                  >
                    <div className={cn("mt-0.5 rounded-lg p-1.5 shrink-0", !n.isRead ? "bg-accent/15 text-[#92400e]" : "bg-muted text-muted-foreground")}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p
                        className={cn(
                          "text-xs leading-relaxed",
                          !n.isRead ? "font-semibold text-foreground" : "text-muted-foreground"
                        )}
                      >
                        <span className="font-bold text-foreground">{n.title}</span>
                        {n.message && <span className="block mt-0.5 text-[11px] leading-relaxed text-muted-foreground/90">{n.message}</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 font-medium">
                        {dateTimeFormat.format(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t border-border/40 p-2">
          <Link href="/dashboard/notifications" className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg text-xs font-semibold text-[#92400e] hover:bg-muted/50 transition-all">
            Lihat semua notifikasi <ChevronRight size={14} />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
