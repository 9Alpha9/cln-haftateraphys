'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const HIDDEN_PREFIXES = ['/dashboard', '/login', '/register'];

function isHiddenRoute(pathname: string): boolean {
  return HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  message?: string;
  label?: string;
  className?: string;
}

export function FloatingWhatsApp({
  phoneNumber = '6281234567890',
  message = 'Halo, saya ingin berkonsultasi dengan Hafta Fisioterapi.',
  label = 'Chat WhatsApp',
  className,
}: FloatingWhatsAppProps) {
  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  const pathname = usePathname();

  if (isHiddenRoute(pathname)) {
    return null;
  }

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group fixed z-40 flex items-center gap-2 rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30 transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 right-4 md:right-6',
        className,
      )}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.75rem)' }}
    >
      <span className="relative flex size-12 items-center justify-center">
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-green-500"
          animate={{ scale: [1, 1.7], opacity: [0.45, 0] }}
          transition={{
            duration: 2.4,
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: 0.7,
          }}
        />
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-green-500"
          animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
          transition={{
            duration: 2.4,
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: 0.7,
            delay: 0.5,
          }}
        />
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <Image
            src="/images/logos/whatsapp-logo.png"
            alt=""
            width={1000}
            height={1000}
            quality={100}
            priority
            className="h-6 w-6 object-contain"
          />
        </span>
      </span>
      <span className="hidden max-w-0 overflow-hidden text-sm font-medium whitespace-nowrap transition-all duration-300 group-hover:max-w-40 group-hover:pr-4 lg:group-hover:block">
        {label}
      </span>
    </motion.a>
  );
}
