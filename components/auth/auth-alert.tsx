'use client';

import { useId, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const variantStyles = {
  error: {
    container: 'border-[var(--hafta-red-200)] bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]',
    Icon: AlertCircle,
  },
  success: {
    container: 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
    Icon: CheckCircle2,
  },
  info: {
    container: 'border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] text-[var(--hafta-950)]',
    Icon: Info,
  },
} as const;

interface AuthAlertProps {
  type: keyof typeof variantStyles;
  message: string;
  title?: string;
  action?: ReactNode;
  className?: string;
}

export function AuthAlert({ type, message, title, action, className }: AuthAlertProps) {
  const { container, Icon } = variantStyles[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-xs leading-relaxed sm:text-sm',
        container,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <p className={cn(title && 'mt-0.5 font-normal')}>{message}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

/**
 * Pesan error inline untuk satu field. Selalu dirender saat `error` ada,
 * dan `id`-nya dipakai oleh input lewat `aria-describedby`.
 */
export function FieldError({ id, children }: { id: string; children?: string | null }) {
  if (!children) return null;

  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1.5 pt-0.5 text-xs font-medium text-[var(--hafta-red-600)] animate-in fade-in-50 duration-200"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Ringkasan error form: SOSOK penting untuk formulir panjang dan pengguna
 * screen reader agar tidak perlu menelusuri tiap field satu per satu.
 */
export function AuthErrorSummary({ errors }: { errors: Array<{ fieldId: string; label: string; message: string }> }) {
  const headingId = useId();
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-labelledby={headingId}
      className="rounded-xl border border-[var(--hafta-red-200)] bg-[var(--hafta-red-50)] px-4 py-3 text-xs text-[var(--hafta-red-700)] sm:text-sm"
    >
      <p id={headingId} className="font-semibold">
        {errors.length === 1 ? 'Periksa 1 isian berikut:' : `Periksa ${errors.length} isian berikut:`}
      </p>
      <ul className="mt-1.5 space-y-1">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(error.fieldId);
                target?.focus();
                target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }}
              className="underline decoration-1 underline-offset-2 hover:no-underline"
            >
              <span className="font-medium">{error.label}</span>: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
