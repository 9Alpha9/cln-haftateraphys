'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, LogOut, Settings, ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SidebarAccountMenu({
  userName,
  roleLabel,
  onProfile,
  onSettings,
  onSecurity,
  onLogout,
}: {
  userName?: string;
  roleLabel: string;
  onProfile: () => void;
  onSettings: () => void;
  onSecurity: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="cursor-pointer flex w-full items-center gap-3 rounded-xl border border-border bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
          {userName?.[0]?.toUpperCase() ?? 'A'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-foreground">{userName || 'Administrator'}</span>
          <span className="block truncate text-xs font-medium text-muted-foreground">{roleLabel}</span>
        </span>
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 rotate-180', open && 'rotate-0')} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 cursor-pointer lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-none fixed inset-x-4 bottom-28 z-50 rounded-2xl border border-border bg-white p-2 shadow-xl lg:pointer-events-auto lg:absolute lg:inset-x-auto lg:bottom-0 lg:left-[calc(100%+26px)] lg:w-56 lg:max-w-[calc(100vw-1rem)] lg:rounded-xl"
              role="menu"
            >
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Akun</p>
              <motion.button
                type="button"
                role="menuitem"
                onClick={() => run(onProfile)}
                className="cursor-pointer flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm hover:bg-surface"
              >
                <User className="h-4 w-4" /> Profil
              </motion.button>
              <motion.button
                type="button"
                role="menuitem"
                onClick={() => run(onSettings)}
                className="cursor-pointer flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm hover:bg-surface"
              >
                <Settings className="h-4 w-4" /> Pengaturan
              </motion.button>
              <motion.button
                type="button"
                role="menuitem"
                onClick={() => run(onSecurity)}
                className="cursor-pointer flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm hover:bg-surface"
              >
                <ShieldCheck className="h-4 w-4" /> Keamanan
              </motion.button>
              <div className="my-2 h-px bg-border" />
              <motion.button
                type="button"
                role="menuitem"
                onClick={() => run(onLogout)}
                className="cursor-pointer flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm text-destructive hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4" /> Keluar
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
