'use client';

import { useState } from 'react';
import { ChevronRight, LogOut, Settings, ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutConfirmModal } from '@/components/auth/logout-confirm-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SidebarAccountMenu({
  userName,
  roleLabel,
  avatarUrl,
  onProfile,
  onSettings,
  onSecurity,
  onLogout,
}: {
  userName?: string;
  roleLabel: string;
  avatarUrl?: string | null;
  onProfile: () => void;
  onSettings: () => void;
  onSecurity: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          aria-label="Menu akun"
          className="cursor-pointer flex w-full items-center gap-3 rounded-xl border border-border bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent text-sm font-bold text-primary-foreground">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              userName?.[0]?.toUpperCase() ?? 'A'
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-foreground">{userName || 'Administrator'}</span>
            <span className="block truncate text-xs font-medium text-muted-foreground">{roleLabel}</span>
          </span>
          <ChevronRight className={cn('h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 rotate-180', open && 'rotate-0')} />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          side="top"
          sideOffset={12}
          className="w-56 p-1.5 shadow-[0_12px_32px_rgba(24,23,0,0.14)]"
        >
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Akun</p>
          <DropdownMenuItem
            onClick={() => run(onProfile)}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-sm text-foreground transition-colors"
          >
            <User className="h-4 w-4" /> Profil
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => run(onSettings)}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-sm text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" /> Pengaturan
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => run(onSecurity)}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-sm text-foreground transition-colors"
          >
            <ShieldCheck className="h-4 w-4" /> Keamanan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setOpen(false);
              setLogoutModalOpen(true);
            }}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-sm text-destructive transition-colors focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onConfirm={onLogout}
        onCancel={() => setLogoutModalOpen(false)}
      />
    </div>
  );
}
