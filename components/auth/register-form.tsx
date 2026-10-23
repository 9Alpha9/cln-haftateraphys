'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, MailCheck, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { AuthAlert } from '@/components/auth/auth-alert';
import { signUp } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

type RegisterFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
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
    const email = String(formData.get('email') ?? '').trim();
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
      errors.email = 'Format alamat email tidak valid (contoh: nama@email.com).';
    }

    // 3. Validasi Password
    if (!password) {
      errors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 8) {
      errors.password = 'Kata sandi minimal 8 karakter.';
    }

    // 4. Validasi Konfirmasi Password
    if (!confirmPassword) {
      errors.confirmPassword = 'Ulangi kata sandi Anda.';
    } else if (password && password !== confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
    }

    // 5. Validasi Syarat & Ketentuan
    if (!termsAccepted) {
      errors.terms = 'Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
            return;
          }

          setFieldErrors({
            email: 'Terjadi kendala saat pendaftaran. Silakan periksa kembali data Anda.',
          });
          return;
        }

        setRegistered(true);
      } catch {
        setGeneralError('Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.');
      }
    });
  }

  if (registered) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--hafta-ylw-100)] text-[#181700] shadow-xs">
          <MailCheck className="size-8" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#181700]">
          Pendaftaran Berhasil
        </h2>
        <p className="text-xs leading-relaxed text-stone-600 sm:text-sm">
          Kami telah mengirimkan tautan verifikasi ke email Anda. Silakan periksa inbox (atau folder spam) untuk
          mengaktifkan akun Patient Portal Anda.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--hafta-ylw-100)] text-sm font-bold text-[#181700] shadow-xs transition-colors hover:bg-[var(--hafta-ylw-200)]"
          >
            Masuk ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── LOGO HANYA DI MOBILE/TABLET (DI DESKTOP SUDAH ADA DI PANEL KIRI) ── */}
      <div className="mb-6 lg:hidden">
        <Link href="/" className="inline-block">
          <Image
            src="/images/logos/logos-text.png"
            alt="Hafta Fisioterapi"
            width={140}
            height={93}
            priority
            className="h-12 w-auto"
          />
        </Link>
      </div>

      {/* ── HEADER FORM RATA KIRI (BERSIH & HUMANIZE) ── */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-[#181700] sm:text-3xl">
          Buat Akun Pasien Baru
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Lengkapi data singkat di bawah ini untuk memudahkan proses asesmen awal dan pemantauan terapi Anda di klinik.
        </p>
      </div>

      {generalError && (
        <div className="mb-5">
          <AuthAlert type="error" message={generalError} />
        </div>
      )}

      {/* ── FORM INPUT ── */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Nama Lengkap */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold text-stone-700">
            Nama Lengkap
          </Label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Masukkan nama lengkap"
            required
            autoComplete="name"
            disabled={isPending}
            onChange={() => clearFieldError('name')}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            className={cn(
              'h-12 w-full rounded-xl border bg-white px-4 text-sm text-[#181700] placeholder:text-stone-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
              fieldErrors.name
                ? 'border-red-500 bg-red-50/30 text-red-950 focus:border-red-600 focus:outline-none focus-visible:outline-none focus:ring-4 focus:ring-red-500/20'
                : 'border-stone-300 hover:border-stone-400 focus:border-[#181700] focus:outline-none focus-visible:outline-none focus:ring-4 focus:ring-[#f7f000]/30'
            )}
          />
          {fieldErrors.name && (
            <p id="name-error" className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-red-600 animate-in fade-in-50 duration-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{fieldErrors.name}</span>
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
            Alamat Email
          </Label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            required
            autoComplete="email"
            disabled={isPending}
            onChange={() => clearFieldError('email')}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            className={cn(
              'h-12 w-full rounded-xl border bg-white px-4 text-sm text-[#181700] placeholder:text-stone-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
              fieldErrors.email
                ? 'border-red-500 bg-red-50/30 text-red-950 focus:border-red-600 focus:outline-none focus-visible:outline-none focus:ring-4 focus:ring-red-500/20'
                : 'border-stone-300 hover:border-stone-400 focus:border-[#181700] focus:outline-none focus-visible:outline-none focus:ring-4 focus:ring-[#f7f000]/30'
            )}
          />
          {fieldErrors.email && (
            <p id="email-error" className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-red-600 animate-in fade-in-50 duration-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        {/* Password & Confirm Password (Grid 2 Kolom di Layar Lebar) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordField
            id="password"
            name="password"
            label="Kata Sandi"
            placeholder="Min. 8 karakter"
            autoComplete="new-password"
            disabled={isPending}
            error={fieldErrors.password}
          />

          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Konfirmasi Sandi"
            placeholder="Ulangi sandi"
            autoComplete="new-password"
            disabled={isPending}
            error={fieldErrors.confirmPassword}
          />
        </div>

        {/* Persetujuan Syarat & Ketentuan */}
        <div className="pt-1">
          <label htmlFor="terms" className="flex items-start gap-2.5 text-xs text-stone-600 cursor-pointer select-none">
            <input
              id="terms"
              type="checkbox"
              name="terms"
              disabled={isPending}
              onChange={() => clearFieldError('terms')}
              aria-invalid={Boolean(fieldErrors.terms)}
              aria-describedby={fieldErrors.terms ? 'terms-error' : undefined}
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0 rounded border cursor-pointer',
                fieldErrors.terms
                  ? 'border-red-500 accent-red-600 ring-2 ring-red-500/30'
                  : 'border-stone-300 accent-[#181700]'
              )}
            />
            <span className="leading-relaxed">
              Saya menyetujui{' '}
              <a href="/terms" className="font-semibold text-stone-900 underline hover:text-[#181700]">
                Syarat &amp; Ketentuan
              </a>{' '}
              dan{' '}
              <a href="/privacy" className="font-semibold text-stone-900 underline hover:text-[#181700]">
                Kebijakan Privasi
              </a>
              .
            </span>
          </label>
          {fieldErrors.terms && (
            <p id="terms-error" className="flex items-center gap-1.5 pt-1.5 text-xs font-medium text-red-600 animate-in fade-in-50 duration-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{fieldErrors.terms}</span>
            </p>
          )}
        </div>

        {/* Tombol Buat Akun */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] text-sm font-bold text-[#181700] shadow-xs transition-all duration-200 hover:bg-[var(--hafta-ylw-200)] hover:shadow-md active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
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
            className="rounded px-1.5 py-0.5 font-bold text-[#181700] underline decoration-[var(--hafta-ylw-100)] decoration-2 underline-offset-4 transition-all hover:bg-[var(--hafta-ylw-100)]/40"
          >
            Masuk ke akun
          </Link>
        </p>
      </form>
    </div>
  );
}
