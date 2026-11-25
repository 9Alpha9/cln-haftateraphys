'use client';

/**
 * Dropdown akun topbar berbasis Radix UI (@radix-ui/react-dropdown-menu) —
 * fondasi resmi shadcn/ui. Radix membungkus positioning di dalam portal-nya
 * sendiri dan memakai floating engine yang menghitung ulang posisi pada setiap
 * perubahan anchor, sehingga panel selalu menempel ke trigger dan mengikuti
 * trigger saat halaman di-scroll. Ketika trigger (topbar sticky) keluar dari
 * area pandang atau halaman di-scroll, panel tetap ter-anchor — dan bila
 * anchor benar-benar hilang, Radix menutup menu secara otomatis.
 *
 * Desain visual mengikuti standar dropdown aplikasi: rounded-2xl, ring
 * halus, item min-h dengan ikon, separator, dan state destruktif untuk logout.
 */

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { LogOut, UserRound } from 'lucide-react';

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
    <DropdownMenuPrimitive.Root modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger
        aria-label="Menu akun"
        className="hidden items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-[var(--hafta-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-200)] md:flex data-[state=open]:bg-[var(--hafta-50)]"
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
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={8}
          collisionPadding={{ top: 76, right: 12, bottom: 80, left: 12 }}
          className="z-[60] w-56 rounded-2xl bg-popover p-1.5 text-popover-foreground shadow-[0_12px_32px_rgba(24,23,0,0.14)] ring-1 ring-foreground/10 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-[#111827]">{userName || 'Pasien'}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail || 'pasien'}</p>
          </div>

          <DropdownMenuPrimitive.Separator className="-mx-1.5 my-1 h-px bg-border" />

          {children}

          <DropdownMenuPrimitive.Item
            onSelect={onProfile}
            className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl px-3 text-xs font-medium text-muted-foreground outline-none select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <UserRound className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Data Saya</span>
          </DropdownMenuPrimitive.Item>

          <DropdownMenuPrimitive.Separator className="-mx-1.5 my-1 h-px bg-border" />

          <DropdownMenuPrimitive.Item
            onSelect={onLogout}
            className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl px-3 text-xs font-medium text-red-600 outline-none select-none focus:bg-red-50 focus:text-red-600 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Keluar</span>
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
