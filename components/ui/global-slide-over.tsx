'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOverlayLayer } from '@/components/ui/use-overlay-layer';
import { useBodyScrollLock } from '@/components/ui/use-body-scroll-lock';
import { DRAWER_ANIMATION } from '@/lib/animation/drawer-animation';

export type SlideOverSize = 'sm' | 'md' | 'lg' | 'xl';

export interface GlobalSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerTabs?: React.ReactNode;
  size?: SlideOverSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerClassName?: string;
  className?: string;
  /** Custom base z-index, useful when the sheet must sit above page-level dropdowns. */
  zIndexBase?: number;
}

const sizeWidthMap: Record<SlideOverSize, string> = {
  sm: 'sm:w-[420px] lg:w-[480px]',
  md: 'sm:w-[480px] lg:w-[560px]',
  lg: 'sm:w-[520px] lg:w-[640px]',
  xl: 'sm:w-[560px] lg:w-[720px]',
};

export function GlobalSlideOver({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  headerTabs,
  size = 'md',
  children,
  footer,
  footerClassName,
  className,
  zIndexBase,
}: GlobalSlideOverProps) {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  /**
   * `isOpen` adalah intent aplikasi; `closing` menahan scroll lock, layer
   * z-index, dan focus trap tetap aktif selama exit animation berjalan.
   * `closing` TIDAK boleh menjadi render gate — kalau ia digating dan baru
   * dimatikan di `onExitComplete`, exit animation tidak pernah dipicu sehingga
   * drawer tidak pernah hilang (deadlock).
   */
  const [previousOpen, setPreviousOpen] = React.useState(isOpen);
  const [closing, setClosing] = React.useState(false);

  if (isOpen !== previousOpen) {
    setPreviousOpen(isOpen);
    if (previousOpen && !isOpen) {
      setClosing(true);
    }
  }

  const active = isOpen || closing;

  const { isTopmost, zIndex } = useOverlayLayer(active, zIndexBase);
  useBodyScrollLock(active);
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const onCloseRef = React.useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    // Let page-level dropdown menus (e.g. SmartFilterMenu) close when a drawer opens.
    window.dispatchEvent(new Event('hafta:overlay-open'));
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  // Focus dikembalikan SETELAH exit animation selesai (`onExitComplete`), bukan
  // saat `isOpen` menjadi false. Mengembalikan fokus di awal closing membuat
  // browser men-scroll ke elemen pemicu saat panel masih terlihat.
  const restoreFocus = React.useCallback(() => {
    previousFocusRef.current?.focus?.();
    previousFocusRef.current = null;
  }, []);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopmost) return;
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const handleCloseAllSlideOvers = () => {
      onCloseRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hafta:close-all-slide-overs', handleCloseAllSlideOvers);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hafta:close-all-slide-overs', handleCloseAllSlideOvers);
    };
  }, [active, isTopmost]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        setClosing(false);
        restoreFocus();
      }}
    >
      {isOpen && (
        <motion.div
          key="global-slide-over"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: DRAWER_ANIMATION.duration,
            ease: DRAWER_ANIMATION.easing,
          }}
        >
          {/* ── 1. STATIC BACKDROP OVERLAY (LOCKED SCREEN BLUR) ── */}
          <motion.div
            key="global-slide-over-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: DRAWER_ANIMATION.backdropDuration,
              ease: DRAWER_ANIMATION.backdropEasing,
            }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-[#181700]/45 backdrop-blur-[2px]"
            style={{ zIndex }}
          />

          {/* ── 2. SLIDE PANEL (SEJAJAR PENUH SISI KANAN LAYAR) ── */}
          <motion.aside
            key="slide-over-panel"
            ref={panelRef}
            tabIndex={-1}
            initial={{ x: DRAWER_ANIMATION.slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: DRAWER_ANIMATION.slideFrom }}
            transition={{
              duration: DRAWER_ANIMATION.duration,
              ease: DRAWER_ANIMATION.easing,
            }}
            className={cn(
              // `overflow-x-clip` clips horizontal overflow WITHOUT turning the
              // panel into a vertical scroll container (which `overflow-x-hidden`
              // would, because CSS then computes overflow-y to `auto`). Only the
              // body section below should scroll, avoiding a second scrollbar.
              'fixed inset-y-0 right-0 flex h-dvh w-full flex-col rounded-none border-l border-stone-200/90 bg-white -[-16px_0_48px_rgba(24,23,0,0.14)] will-change-transform overflow-x-clip',
              sizeWidthMap[size],
              className
            )}
            style={{ zIndex: zIndex + 1 }}
          >
            {/* ── 2A. UNIFIED HEADER (ICON KIRI, JUDUL TENGAH, CLOSE KANAN) ── */}
            <header className="sticky top-0 z-10 shrink-0 border-b border-stone-100 bg-white/95 px-3.5 py-3.5 backdrop-blur-sm sm:px-6 sm:py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Lingkaran Ikon Kuning Hafta */}
                  {icon ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-org-100)] text-[#181700]  mt-0.5">
                      {icon}
                    </div>
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 id={titleId} className="truncate text-base font-bold tracking-tight text-[#181700] sm:text-lg">
                        {title}
                      </h2>
                      {badge}
                    </div>
                    {subtitle && (
                      <p className="mt-0.5 truncate text-xs text-stone-500 font-medium">
                        {subtitle}
                      </p>
                    )}
                </div>
              </div>

              {/* Tombol Tutup Bulat */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup panel"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-[#181700] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sub-header Tabs / Pills (Filter Bergaya Notification Pills) */}
            {headerTabs && <div className="mt-3.5 pt-1">{headerTabs}</div>}
          </header>

            {/* ── 2B. SCROLLABLE BODY ── */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 py-3.5 sm:px-6 sm:py-4">
              {children}
            </div>

            {/* ── 2C. SOLID DOCKED ACTION FOOTER ── */}
            {footer && (
              <footer className={cn("shrink-0 border-t border-stone-200/80 bg-[var(--background)] px-3.5 py-3 sm:px-6 sm:py-3.5 flex flex-col gap-2.5 w-full", footerClassName)}>
                {footer}
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
