'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/auth/auth-alert';
import { cn } from '@/lib/utils';

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  /** Tautan "Lupa kata sandi?" pada baris label. */
  hint?: React.ReactNode;
  /** Teks bantuan di bawah input, disembunyikan saat ada error. */
  description?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  onChange?: () => void;
  defaultValue?: string;
}

export function PasswordField({
  id,
  name,
  label,
  placeholder = 'Masukkan kata sandi',
  required = true,
  autoComplete = 'current-password',
  hint,
  description,
  className,
  disabled,
  error,
  onChange,
  defaultValue,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const descriptionId = useId();
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : description ? descriptionId : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-xs font-semibold text-stone-700">
          {label}
          {required ? (
            <span className="ml-0.5 text-[var(--hafta-red-600)]" aria-hidden="true">
              *
            </span>
          ) : null}
        </Label>
        {hint}
      </div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          defaultValue={defaultValue}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-errormessage={error ? errorId : undefined}
          className={cn(
            'h-12 w-full rounded-xl border bg-white px-4 pr-12 text-base text-[var(--hafta-950)] placeholder:text-sm placeholder:text-stone-400 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
            error
              ? 'border-[var(--hafta-red-400)] bg-[var(--hafta-red-50)]/40 focus:border-[var(--hafta-red-500)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-red-200)]/50'
              : 'border-stone-300 hover:border-stone-400 focus:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/30'
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {description && !error ? (
        <p id={descriptionId} className="pt-0.5 text-xs text-stone-500">
          {description}
        </p>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
