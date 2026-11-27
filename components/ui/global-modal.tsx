'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useOverlayLayer } from '@/components/ui/use-overlay-layer';
import { useBodyScrollLock } from '@/components/ui/use-body-scroll-lock';
import { useFullscreenElement } from '@/components/ui/overlay-positioning';
import { cn } from '@/lib/utils';

export type GlobalModalSize = 'sm' | 'md' | 'lg';

const sizeWidthMap: Record<GlobalModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

export interface GlobalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  size?: GlobalModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerClassName?: string;
  className?: string;
  /** Custom base z-index, useful when the modal must sit above page-level dropdowns. */
  zIndexBase?: number;
}

/**
 * Global popup modal — satu-satunya gaya modal aplikasi.
 * Mobile: bottom sheet (slide up). Desktop: popup di tengah layar.
 */
export function GlobalModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  size = 'md',
  children,
  footer,
  footerClassName,
  className,
  zIndexBase,
}: GlobalModalProps) {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { isTopmost, zIndex } = useOverlayLayer(isOpen, zIndexBase);
  useBodyScrollLock(isOpen);
  const fullscreenElement = useFullscreenElement();
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const onCloseRef = React.useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isTopmost]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="global-modal"
          className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
          style={{ zIndex }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.99 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── BACKDROP ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-[var(--hafta-900)]/45 backdrop-blur-[2px]"
          />

          {/* ── PANEL: bottom sheet di mobile, popup di desktop ── */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-[0_1px_2px_rgba(28,25,23,0.06),0_24px_64px_-24px_rgba(28,25,23,0.28)] sm:rounded-3xl',
              sizeWidthMap[size],
              className,
            )}
          >
            {/* ── HEADER ── */}
            <header className="shrink-0 border-b border-border/70 px-4 pb-3.5 pt-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {icon ? (
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-50)] text-[var(--hafta-800)]">
                      {icon}
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 id={titleId} className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                        {title}
                      </h2>
                      {badge}
                    </div>
                    {subtitle ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* ── BODY ── */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              {children}
            </div>

            {/* ── FOOTER ── */}
            {footer ? (
              <footer
                className={cn(
                  'flex w-full shrink-0 flex-col gap-2 border-t border-border/70 bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5',
                  footerClassName,
                )}
              >
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    fullscreenElement ?? document.body,
  );
}
