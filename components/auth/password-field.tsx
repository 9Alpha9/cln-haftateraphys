'use client';

import { useId, useState } from 'react';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/auth/auth-alert';
import { cn } from '@/lib/utils';
import {
  evaluatePasswordStrength,
  type PasswordStrengthTone,
} from '@/lib/auth/password-strength';

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
  /**
   * Tampilkan indikator kekuatan kata sandi di bawah input. Hanya untuk
   * pembuatan kata sandi baru (register, reset); jangan dipakai di form login
   * agar kebijakan kata sandi tidak bocor ke halaman masuk.
   */
  showStrength?: boolean;
}

const TONE_SEGMENT: Record<PasswordStrengthTone, string> = {
  danger: 'bg-[var(--hafta-red-500)]',
  warning: 'bg-[var(--hafta-500)]',
  success: 'bg-[var(--hafta-grn-500)]',
};

const TONE_TEXT: Record<PasswordStrengthTone, string> = {
  danger: 'text-[var(--hafta-red-600)]',
  warning: 'text-[var(--hafta-700)]',
  success: 'text-[var(--hafta-grn-700)]',
};

const TOTAL_SEGMENTS = 4;

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
  showStrength = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(defaultValue ?? '');
  const descriptionId = useId();
  const strengthId = useId();
  const errorId = `${id}-error`;

  const strength = showStrength ? evaluatePasswordStrength(value) : null;
  // Checklist syarat baru muncul setelah pengguna mengetik supaya tinggi form
  // di layar 320px tidak berubah saat fokus pertama.
  const showStrengthHints = Boolean(strength && value.length > 0 && strength.pendingHints.length > 0);

  const describedBy = [
    error ? errorId : null,
    strength ? strengthId : null,
    !error && description ? descriptionId : null,
  ]
    .filter(Boolean)
    .join(' ');

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
          onChange={(event) => {
            if (showStrength) setValue(event.target.value);
            onChange?.();
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
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
          onClick={() => setVisible((current) => !current)}
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

      {strength ? (
        <div id={strengthId} className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {Array.from({ length: TOTAL_SEGMENTS }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors duration-200',
                    index < strength.filledSegments
                      ? TONE_SEGMENT[strength.tone]
                      : 'bg-stone-200',
                  )}
                />
              ))}
            </div>
            <p
              role="status"
              aria-live="polite"
              className="flex shrink-0 items-center gap-1 text-xs font-semibold"
            >
              {strength.tone === 'danger' ? (
                <AlertCircle className={cn('size-3.5', TONE_TEXT[strength.tone])} aria-hidden="true" />
              ) : null}
              <span className={TONE_TEXT[strength.tone]}>{strength.label}</span>
            </p>
          </div>

          {showStrengthHints ? (
            <ul className="space-y-1 text-xs text-stone-600">
              {strength.pendingHints.map((pending) => (
                <li key={pending} className="flex items-start gap-1.5">
                  <span
                    className="mt-1 size-1 shrink-0 rounded-full bg-stone-400"
                    aria-hidden="true"
                  />
                  <span>{pending}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {strength.label === 'Kuat' ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--hafta-grn-700)]">
              <Check className="size-3.5" aria-hidden="true" />
              Kata sandi sudah kuat.
            </p>
          ) : null}
        </div>
      ) : null}

      {description && !error ? (
        <p id={descriptionId} className="pt-0.5 text-xs text-stone-500">
          {description}
        </p>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
