'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { AuthAlert, AuthErrorSummary, FieldError } from '@/components/auth/auth-alert';
import { getSession, signIn, signUp } from '@/lib/auth/client';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password-strength';
import { ensureCurrentPatientProfile } from '@/server/actions/patient-profile';
import { cn } from '@/lib/utils';

type RegisterFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_LABELS: Record<keyof RegisterFieldErrors, string> = {
  name: 'Nama lengkap',
  email: 'Alamat email',
  password: 'Kata sandi',
  confirmPassword: 'Konfirmasi sandi',
  terms: 'Persetujuan',
};

export function RegisterForm({ reason }: { reason?: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [registered, setRegistered] = useState(false);

  const clearFieldError = (field: keyof RegisterFieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');
    const termsAccepted = formData.get('terms') === 'on';

    const errors: RegisterFieldErrors = {};

    // 1. Validasi Nama
    if (!name) {
      errors.name = 'Nama lengkap wajib diisi.';
    } else if (name.length < 2) {
      errors.name = 'Nama lengkap minimal 2 karakter.';
    }

    // 2. Validasi Email
    if (!email) {
      errors.email = 'Alamat email wajib diisi.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Format alamat email tidak valid, misalnya nama@email.com.';
    }

    // 3. Validasi Password
    if (!password) {
      errors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    }

    // 4. Validasi Konfirmasi Password
    if (!confirmPassword) {
      errors.confirmPassword = 'Ulangi kata sandi Anda.';
    } else if (password && password !== confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
    }

    // 5. Validasi Syarat & Ketentuan
    if (!termsAccepted) {
      errors.terms = 'Centang persetujuan sebelum melanjutkan.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstField = Object.keys(errors)[0];
      document.getElementById(firstField)?.focus();
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      try {
        const result = await signUp.email({
          name,
          email,
          password,
          callbackURL: '/login',
        });

        if (result?.error) {
          const errData = result.error as { message?: string; code?: string };

          if (errData?.code === 'USER_ALREADY_EXISTS') {
            setFieldErrors({
              email: 'Alamat email ini sudah terdaftar. Silakan masuk atau gunakan email lain.',
            });
            document.getElementById('email')?.focus();
            return;
          }

          setFieldErrors({
            email: 'Pendaftaran tidak dapat diproses. Periksa kembali data Anda.',
          });
          return;
        }

        // Pastikan sesi login benar-benar aktif. signUp biasanya sudah
        // membuat sesi, tetapi bila belum, login otomatis agar tombol
        // "Lanjutkan ke Dashboard" tidak terlempar kembali ke halaman login.
        const session = await getSession();
        if (!session?.data) {
          const signInResult = await signIn.email({
            email,
            password,
            callbackURL: '/dashboard',
          });
          if (signInResult?.error) {
            setGeneralError(
              'Akun berhasil dibuat, tetapi sesi login belum aktif. Silakan masuk melalui halaman login.',
            );
            return;
          }
        }

        // Buat profil pasien sejak awal agar pasien baru dapat langsung
        // memilih terapis, tanggal, dan jam.
        await ensureCurrentPatientProfile().catch(() => null);

        setRegistered(true);
      } catch {
        setGeneralError(
          'Kami tidak dapat menghubungkan ke server saat ini. Periksa koneksi Anda lalu coba lagi.',
        );
      }
    });
  }

  if (registered) {
    return (
      <div role="status" className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--hafta-org-100)] text-[var(--hafta-950)]">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-balance text-[var(--hafta-950)]">
          Akun Berhasil Dibuat
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
          Akun pasien Anda sudah aktif. Lanjutkan ke dashboard untuk memilih tanggal, jam, dan
          fisioterapis untuk sesi terapi pertama Anda.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--hafta-300)] text-sm font-bold text-[var(--hafta-950)] transition-colors hover:bg-[var(--hafta-400)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-300)]/50"
          >
            Lanjutkan ke Dashboard
          </Link>
          <p className="text-xs text-stone-600">
            Ingin masuk dengan akun lain?{' '}
            <Link
              href="/login"
              className="rounded font-bold text-[var(--hafta-950)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const summaryErrors = (Object.keys(fieldErrors) as Array<keyof RegisterFieldErrors>).map(
    (field) => ({
      fieldId: field,
      label: FIELD_LABELS[field],
      message: fieldErrors[field] ?? '',
    }),
  );

  return (
    <div>
      {/* ── HEADER FORM RATA KIRI (BERSIH & HUMANIZE) ── */}
      <div className="mb-6 sm:mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-balance text-[var(--hafta-950)] sm:text-3xl">
          Buat Akun Pasien
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600">
          Isi data dasar dulu. Data klinis dilengkapi saat sesi pertama.
        </p>
      </div>



      {generalError ? (
        <div className="mb-5">
          <AuthAlert type="error" message={generalError} />
        </div>
      ) : null}

      {summaryErrors.length > 1 ? (
        <div className="mb-5">
          <AuthErrorSummary errors={summaryErrors} />
        </div>
      ) : null}

      {/* ── FORM INPUT ── */}
      <form onSubmit={handleSubmit} method="post" className="space-y-4" noValidate>
        {/* Nama Lengkap */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold text-stone-700">
            Nama Lengkap
            <span className="ml-0.5 text-[var(--hafta-red-600)]" aria-hidden="true">
              *
            </span>
          </Label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Sesuai KTP"
            required
            autoComplete="name"
            disabled={isPending}
            onChange={() => clearFieldError('name')}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            className={cn(
              'h-12 w-full rounded-xl border bg-white px-4 text-base text-[var(--hafta-950)] placeholder:text-sm placeholder:text-stone-400 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
              fieldErrors.name
                ? 'border-[var(--hafta-red-400)] bg-[var(--hafta-red-50)]/40 focus:border-[var(--hafta-red-500)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-red-200)]/50'
                : 'border-stone-300 hover:border-stone-400 focus:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/30'
            )}
          />
          <FieldError id="name-error">{fieldErrors.name}</FieldError>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
            Alamat Email
            <span className="ml-0.5 text-[var(--hafta-red-600)]" aria-hidden="true">
              *
            </span>
          </Label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nama@email.com"
            required
            autoComplete="email"
            disabled={isPending}
            onChange={() => clearFieldError('email')}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            className={cn(
              'h-12 w-full rounded-xl border bg-white px-4 text-base text-[var(--hafta-950)] placeholder:text-sm placeholder:text-stone-400 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
              fieldErrors.email
                ? 'border-[var(--hafta-red-400)] bg-[var(--hafta-red-50)]/40 focus:border-[var(--hafta-red-500)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-red-200)]/50'
                : 'border-stone-300 hover:border-stone-400 focus:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/30'
            )}
          />
          <FieldError id="email-error">{fieldErrors.email}</FieldError>
        </div>

        {/* Password & Confirm Password */}
        <PasswordField
          id="password"
          name="password"
          label="Kata Sandi"
          placeholder="Minimal 8 karakter"
          description="Gunakan kombinasi yang mudah Anda ingat namun sulit ditebak orang lain."
          autoComplete="new-password"
          disabled={isPending}
          error={fieldErrors.password}
          onChange={() => clearFieldError('password')}
          showStrength
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Konfirmasi Kata Sandi"
          placeholder="Ulangi kata sandi"
          autoComplete="new-password"
          disabled={isPending}
          error={fieldErrors.confirmPassword}
          onChange={() => clearFieldError('confirmPassword')}
        />

        {/* Persetujuan Syarat & Ketentuan */}
        <div className="pt-1">
          <label
            htmlFor="terms"
            className="flex cursor-pointer select-none items-start gap-2.5 rounded-lg text-xs leading-relaxed text-stone-700"
          >
            <input
              id="terms"
              type="checkbox"
              name="terms"
              disabled={isPending}
              onChange={() => clearFieldError('terms')}
              aria-invalid={Boolean(fieldErrors.terms)}
              aria-describedby={fieldErrors.terms ? 'terms-error' : undefined}
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded',
                fieldErrors.terms
                  ? 'border-[var(--hafta-red-500)] accent-[var(--hafta-red-600)] ring-2 ring-[var(--hafta-red-200)]'
                  : 'border-stone-400 accent-[var(--hafta-950)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]'
              )}
            />
            <span>
              Saya menyetujui{' '}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded font-semibold text-[var(--hafta-950)] underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
              >
                Syarat &amp; Ketentuan
              </Link>{' '}
              dan{' '}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded font-semibold text-[var(--hafta-950)] underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
              >
                Kebijakan Privasi
              </Link>
              .
            </span>
          </label>
          <FieldError id="terms-error">{fieldErrors.terms}</FieldError>
        </div>

        {/* Tombol Buat Akun */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--hafta-300)] text-sm font-bold text-[var(--hafta-950)] transition-colors duration-200 hover:bg-[var(--hafta-400)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-300)]/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Mendaftarkan...</span>
              </>
            ) : (
              'Buat Akun Pasien'
            )}
          </button>
        </div>

        {/* Link Masuk Berkontras Jelas */}
        <p className="pt-2 text-center text-xs text-stone-600 sm:text-sm">
          Sudah memiliki akun?{' '}
          <Link
            href="/login"
            className="rounded px-1 py-0.5 font-bold text-[var(--hafta-950)] underline decoration-[var(--hafta-org-300)] decoration-2 underline-offset-4 transition-colors hover:bg-[var(--hafta-org-100)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
          >
            Masuk ke akun
          </Link>
        </p>
      </form>
    </div>
  );
}
