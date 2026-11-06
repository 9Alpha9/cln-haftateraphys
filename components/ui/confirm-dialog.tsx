"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverlayLayer } from "@/components/ui/use-overlay-layer";
import { useBodyScrollLock } from "@/components/ui/use-body-scroll-lock";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  pending?: boolean;
  icon?: ReactNode;
  iconClassName?: string;
  panelClassName?: string;
  confirmClassName?: string;
  cancelClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  variant = "default",
  pending = false,
  icon,
  iconClassName,
  panelClassName,
  confirmClassName,
  cancelClassName,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { isTopmost, zIndex } = useOverlayLayer(isOpen);
  useBodyScrollLock(isOpen);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !pending && isTopmost) {
        e.stopPropagation();
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !isOpen || !panelRef.current) return;

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
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pending, onCancel, isTopmost]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirm-dialog"
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.99 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={pending ? undefined : onCancel}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-200/70 bg-white shadow-[0_18px_50px_rgba(24,23,0,0.18)]",
              panelClassName,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <div
                  className={cn(
                    "mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:mx-0",
                    variant === "destructive"
                      ? "bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]"
                      : "bg-[var(--hafta-ylw-50)] text-[#181700]",
                    iconClassName,
                  )}
                >
                  {icon ?? (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h3 id={titleId} className="text-base font-bold text-[#181700] sm:text-lg">{title}</h3>
                  {description ? (
                    <div id={descriptionId} className="mt-1.5 text-xs leading-relaxed text-stone-600 sm:mt-2 sm:text-sm">
                      {description}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-stone-100 bg-[#FAFAF8] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-4">
              <Button
                type="button"
                variant={variant}
                onClick={onConfirm}
                disabled={pending}
                className={cn("h-10 w-full rounded-full px-4 text-xs font-bold text-white transition-all active:scale-[0.99] sm:h-11 sm:w-auto", variant === "destructive" ? "bg-[var(--hafta-red-600)] hover:bg-[var(--hafta-red-700)]" : "bg-[var(--hafta-ylw-100)] text-[#181700] shadow-2xs hover:bg-[var(--hafta-ylw-200)]", confirmClassName)}
              >
                {pending ? "Memproses..." : confirmLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={pending}
                className={cn("h-10 w-full rounded-full border-stone-200 bg-white px-4 text-xs font-semibold text-[#181700] transition-all hover:bg-stone-100 hover:text-[#181700] active:scale-[0.99] sm:h-11 sm:w-auto", cancelClassName)}
              >
                {cancelLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
