'use client';

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

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current text-[#052e16]">
      <path d="M12.04 2C6.51 2 2.02 6.48 2.02 12c0 1.77.46 3.49 1.34 5L2 22l5.14-1.31A10.02 10.02 0 0 0 12.04 22c5.52 0 10-4.48 10-10S17.56 2 12.04 2Zm0 18.17c-1.47 0-2.91-.4-4.17-1.15l-.3-.18-3.05.78.81-2.97-.2-.31A8.13 8.13 0 0 1 3.9 12c0-4.49 3.65-8.14 8.14-8.14 4.48 0 8.13 3.65 8.13 8.14s-3.65 8.17-8.13 8.17Zm4.46-6.11c-.24-.12-1.42-.7-1.64-.77-.22-.08-.38-.12-.54.12-.16.23-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.23-.01-.36.11-.48.11-.1.24-.27.36-.4.12-.14.16-.23.24-.39.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.23-.84.82-.84 2s.86 2.33.98 2.49c.12.16 1.69 2.58 4.1 3.61.57.25 1.02.39 1.37.5.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

export function FloatingWhatsApp({
  phoneNumber = '6281232932872',
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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 sm:w-auto sm:px-5 items-center justify-center gap-2.5 rounded-full bg-[#25D366] text-[#052e16] font-medium shadow-lg hover:bg-[#20ba5a] hover:scale-105 active:scale-95 transition-all duration-300',
        className,
      )}
    >
      <WhatsAppIcon />
      <span className="hidden sm:inline text-sm font-medium whitespace-nowrap leading-none">
        {label}
      </span>
    </a>
  );
}
