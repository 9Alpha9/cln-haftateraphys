'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackToTopProps {
  showAfter?: number;
  label?: string;
  position?: 'fixed' | 'static';
  className?: string;
}

export function BackToTop({ showAfter = 400, label = 'Kembali ke atas', position = 'fixed', className }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (position === 'static') {
      setVisible(true);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > showAfter);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [showAfter, position]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFixed = position === 'fixed';

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label={label}
          title={label}
          onClick={scrollToTop}
          initial={isFixed ? { opacity: 0, scale: 0.8, y: 8 } : undefined}
          animate={isFixed ? { opacity: 1, scale: 1, y: 0 } : undefined}
          exit={isFixed ? { opacity: 0, scale: 0.8, y: 8 } : undefined}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          whileTap={{ scale: 0.92 }}
          className={cn(
            'cursor-pointer flex items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            isFixed
              ? 'fixed z-40 size-12 border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 right-4 md:right-6'
              : 'relative size-10 border-white/20 bg-white/10 text-white hover:bg-white/20',
            className,
          )}
          style={isFixed ? { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' } : undefined}
        >
          <ArrowUp className="size-5" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
