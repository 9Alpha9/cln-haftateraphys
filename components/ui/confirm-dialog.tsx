"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverlayLayer } from "@/components/ui/use-overlay-layer";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  pending?: boolean;
  mainFirst?: boolean;
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
  mainFirst = false,
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
  const { zIndex } = useOverlayLayer(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !pending) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pending, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
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
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl",
              panelClassName,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
                    variant === "destructive" ? "bg-destructive/10" : "bg-primary/10",
                    iconClassName,
                  )}
                >
                  {icon ?? (
                    <AlertTriangle
                      className={`h-6 w-6 sm:h-5 sm:w-5 ${
                        variant === "destructive" ? "text-destructive" : "text-primary"
                      }`}
                    />
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  {description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div
              className={cn(
                "flex flex-col-reverse gap-2 bg-surface px-6 py-4 sm:justify-between sm:gap-3",
                mainFirst ? "sm:flex-row-reverse" : "sm:flex-row",
              )}
            >
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={pending}
                className={cn("w-full sm:w-auto", cancelClassName)}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={variant}
                onClick={onConfirm}
                disabled={pending}
                className={cn("w-full sm:w-auto", confirmClassName)}
              >
                {pending ? "Memproses..." : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
