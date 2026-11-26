'use client';

/**
 * Dropdown akun topbar menggunakan wrapper global `DropdownMenu` (Radix UI)
 * agar berbagi kebijakan positioning responsif, animasi opacity-only, dan
 * perilaku non-modal dengan seluruh dropdown aplikasi, dengan layer `z-[60]`
 * di atas topbar (`z-[55]`).
 */

import * as React from 'react';
import { LogOut, UserRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TopbarAccountMenu({
  userName,
  userEmail,
  avatarUrl,
  onProfile,
  onLogout,
  children,
}: {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
  onProfile: () => void;
  onLogout: () => void;
  /** Slot tambahan (mis. menu khusus role) yang dirender di atas aksi akun. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Menu akun"
        className="hidden cursor-pointer items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-[var(--hafta-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-200)] md:flex data-[state=open]:bg-[var(--hafta-50)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-org-50)] text-sm font-bold text-[var(--hafta-org-900)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            userName?.[0]?.toUpperCase() ?? 'P'
          )}
        </span>
        <span className="hidden min-w-0 flex-col text-left sm:flex">
          <span className="truncate text-xs font-bold text-[#111827]">{userName || 'Pasien'}</span>
          <span className="truncate text-[11px] text-muted-foreground">{userEmail || 'pasien'}</span>
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[60] w-56 p-1.5 shadow-[0_12px_32px_rgba(24,23,0,0.14)]"
      >
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold text-[#111827]">{userName || 'Pasien'}</p>
          <p className="truncate text-xs text-muted-foreground">{userEmail || 'pasien'}</p>
        </div>

        <DropdownMenuSeparator className="-mx-1.5 my-1" />

        {children}

        <DropdownMenuItem
          onSelect={onProfile}
          className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl px-3 text-xs font-medium text-muted-foreground"
        >
          <UserRound className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">Data Saya</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="-mx-1.5 my-1" />

        <DropdownMenuItem
          variant="destructive"
          onSelect={onLogout}
          className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl px-3 text-xs font-medium text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
