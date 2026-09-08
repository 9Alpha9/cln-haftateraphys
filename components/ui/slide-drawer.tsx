'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  closeOnOutsideClick?: boolean;
  overlayClassName?: string;
}

export function SlideDrawer({
  open,
  onClose,
  title,
  headerRight,
  children,
  width = 'w-[min(100vw,24rem)]',
  closeOnOutsideClick = false,
  overlayClassName,
}: SlideDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const preventScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const drawer = document.querySelector('[data-slide-drawer]');
      if (drawer && drawer.contains(target)) return;
      e.preventDefault();
    };

    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn('fixed inset-0 z-[40] cursor-default bg-transparent', overlayClassName)}
            style={{ pointerEvents: 'auto' }}
            aria-hidden="true"
            onClick={() => {
              if (closeOnOutsideClick) onClose();
            }}
          />

          <motion.aside
            key="drawer"
            data-slide-drawer
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={cn(
              'rounded-tl-2xl rounded-bl-2xl fixed inset-y-0 right-0 z-[41] flex h-screen flex-col overflow-hidden bg-white shadow-2xl',
              width
            )}
          >
            {(title || headerRight) && (
              <div className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] px-4 py-3.5 sm:px-5 bg-white z-10">
                <div className="flex items-center gap-2">
                  {title}
                </div>
                <div className="flex items-center gap-2">
                  {headerRight}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] transition-colors hover:bg-[#F7FAF8] hover:text-[#111827]"
                    aria-label="Tutup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            <motion.div
              key="drawer-content"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
              }}
              className="flex-1 overflow-y-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
