"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  Home,
  Users,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRoleLabel, getRoleColor } from "@/lib/role-utils";
import type { Role } from "@/lib/permissions";

const navigation = [
  { name: "Beranda", href: "/dashboard", icon: Home },
  { name: "Daftar Pasien", href: "/dashboard/patients", icon: Users },
  { name: "Manajemen Pengguna", href: "/dashboard/users", icon: Users },
  { name: "Log Audit", href: "/dashboard/audit-logs", icon: FileText },
  { name: "Pengaturan", href: "/dashboard/settings", icon: Settings },
];

export function AdminDashboardShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-border transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
              H
            </div>
            <span className="font-semibold text-foreground">Hafta</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center gap-2 rounded-md px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                getRoleColor(role)
              )}
            >
              {getRoleLabel(role)}
            </span>
          </div>
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-white px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                getRoleColor(role)
              )}
            >
              {getRoleLabel(role)}
            </span>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
