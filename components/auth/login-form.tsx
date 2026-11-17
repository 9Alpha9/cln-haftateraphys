'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { AuthAlert, FieldError } from '@/components/auth/auth-alert';
import { authClient, signIn } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

type FieldErrors = {
  email?: string;
  password?: string;
};

const REMEMBER_EMAIL_KEY = 'hafta_remembered_email';
const REMEMBER_ME_KEY = 'hafta_remember_me';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginFormProps = {
  reason?: string | null;
};

export function LoginForm({ reason }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [email, setEmail] = useState('');
  // Preferensi "Ingat email saya" hanya berisi email (bukan kredensial) dan
  // dibaca sekali saat mount. Nilai remote tidak pernah aktif di server,
  // sehingga tidak ada mismatch hidrasi.
  const [savedEmail] = useState(() =>
    typeof window === 'undefined' ? '' : (window.localStorage.getItem(REMEMBER_EMAIL_KEY) ?? ''),
  );
  const [remember, setRemember] = useState(savedEmail.length > 0);
  const [rememberDevice, setRememberDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(REMEMBER_ME_KEY) === '1';
  });
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const reasonBanner =
    reason === 'idle'
      ? 'Sesi Anda dikunci otomatis karena tidak ada aktivitas, untuk melindungi kerahasiaan data medis. Silakan masuk kembali.'
      : reason === 'closed'
        ? 'Sesi sebelumnya berakhir saat browser ditutup. Silakan masuk kembali untuk melanjutkan.'
        : reason === 'suspended'
          ? 'Akun Anda sedang ditangguhkan. Hubungi admin Hafta untuk informasi lebih lanjut.'
          : null;

  const persistEmail = (value: string) => {
    if (remember) {
      window.localStorage.setItem(REMEMBER_EMAIL_KEY, value);
    } else {
      window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  };

  const persistRememberDevice = () => {
    if (rememberDevice) {
      window.localStorage.setItem(REMEMBER_ME_KEY, '1');
    } else {
      window.localStorage.removeItem(REMEMBER_ME_KEY);
    }
  };

  const clearFieldError = (field: keyof FieldErrors) => {
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
    const submittedEmail = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    const errors: FieldErrors = {};

    if (!submittedEmail) {
      errors.email = 'Alamat email wajib diisi.';
    } else if (!EMAIL_REGEX.test(submittedEmail)) {
      errors.email = 'Format alamat email tidak valid, misalnya nama@email.com.';
    }

    if (!password) {
      errors.password = 'Kata sandi wajib diisi.';
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
        const result = await signIn.email({
          email: submittedEmail,
          password,
          callbackURL: '/dashboard',
        });

        if (result?.error) {
          const errData = result.error as { message?: string; code?: string };

          if (errData?.code === 'EMAIL_NOT_VERIFIED') {
            setGeneralError(
              'Email Anda belum diverifikasi. Periksa kotak masuk atau folder spam untuk tautan verifikasi.',
            );
            return;
          }

          if (errData?.code === 'ACCOUNT_SUSPENDED') {
            setGeneralError(
              'Akun Anda sedang ditangguhkan. Hubungi admin Hafta untuk informasi lebih lanjut.',
            );
            return;
          }

          // Error kredensial memakai pesan generik (tidak membedakan email
          // terdaftar atau password salah) sesuai spesifikasi auth.
          setGeneralError('Email atau kata sandi tidak sesuai. Silakan periksa kembali.');
          return;
        }

        if ((result.data as { twoFactorRedirect?: boolean } | undefined)?.twoFactorRedirect) {
          setTwoFactorRequired(true);
          return;
        }

        persistEmail(submittedEmail);
        persistRememberDevice();
        router.push('/dashboard');
        router.refresh();
      } catch {
        setGeneralError(
          'Kami tidak dapat menghubungkan ke server saat ini. Periksa koneksi Anda lalu coba lagi.',
        );
      }
    });
  }

  function verifyTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({ code: twoFactorCode.trim() })
        : await authClient.twoFactor.verifyTotp({ code: twoFactorCode.trim() });

      if (result.error) {
        setGeneralError(result.error.message ?? 'Kode verifikasi tidak valid.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    });
  }

  if (twoFactorRequired) {
    return (
      <div>
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-balance text-[var(--hafta-950)] sm:text-3xl">
            Verifikasi Dua Faktor
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {useBackupCode
              ? 'Masukkan salah satu kode cadangan Anda.'
              : 'Masukkan 6 digit kode dari aplikasi authenticator Anda.'}
          </p>
        </div>

        {generalError ? (
          <div className="mb-5">
            <AuthAlert type="error" message={generalError} />
          </div>
        ) : null}

        <form onSubmit={verifyTwoFactor} method="post" className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="twoFactorCode" className="text-xs font-semibold text-stone-700">
              {useBackupCode ? 'Kode cadangan' : 'Kode verifikasi'}
            </Label>
            <input
              id="twoFactorCode"
              value={twoFactorCode}
              onChange={(event) =>
                setTwoFactorCode(
                  useBackupCode ? event.target.value : event.target.value.replace(/\D/g, ''),
                )
              }
              inputMode={useBackupCode ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              maxLength={useBackupCode ? 32 : 6}
              placeholder={useBackupCode ? 'Kode cadangan' : '000000'}
              required
              disabled={isPending}
              className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-center font-mono text-lg tracking-[0.3em] text-[var(--hafta-950)] transition-colors focus:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/30 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--hafta-300)] text-sm font-bold text-[var(--hafta-950)] transition-colors hover:bg-[var(--hafta-400)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-300)]/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            <span>{isPending ? 'Memverifikasi...' : 'Verifikasi'}</span>
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode((value) => !value);
              setTwoFactorCode('');
              setGeneralError(null);
            }}
            className="cursor-pointer self-start rounded font-semibold text-stone-700 underline underline-offset-2 transition-colors hover:text-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
          >
            {useBackupCode ? 'Gunakan kode authenticator' : 'Gunakan kode cadangan'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTwoFactorRequired(false);
              setTwoFactorCode('');
              setGeneralError(null);
            }}
            className="cursor-pointer self-start rounded text-stone-600 underline-offset-2 hover:text-[var(--hafta-950)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
          >
            Kembali ke halaman masuk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── LOGO HANYA DI MOBILE/TABLET (DI DESKTOP SUDAH ADA DI PANEL KIRI) ── */}
      <div className="mb-6 lg:hidden">
        <Link href="/" className="inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/40">
          <Image
            src="/images/logos/logos-text.png"
            alt="Hafta Fisioterapi"
            width={140}
            height={93}
            priority
            className="h-11 w-auto sm:h-12"
          />
        </Link>
      </div>

      {/* ── HEADER FORM RATA KIRI (BERSIH & HUMANIZE) ── */}
      <div className="mb-6 sm:mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-balance text-[var(--hafta-950)] sm:text-3xl">
          Masuk ke Akun Anda
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Pantau jadwal sesi, catatan perkembangan terapi, dan program latihan mandiri Anda.
        </p>
      </div>

      {reasonBanner ? (
        <div className="mb-5">
          <AuthAlert type="info" message={reasonBanner} />
        </div>
      ) : null}

      {generalError ? (
        <div className="mb-5">
          <AuthAlert
            type="error"
            message={generalError}
            action={
              <a
                href="https://wa.me/6281232932872?text=Halo%20Admin%20Hafta%20Fisioterapi,%20saya%20butuh%20bantuan%20masuk%20ke%20akun%20pasien."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline"
              >
                Hubungi admin via WhatsApp
              </a>
            }
          />
        </div>
      ) : null}

      {/* ── FORM INPUT ── */}
      <form onSubmit={handleSubmit} method="post" className="space-y-4" noValidate>
        {/* `savedEmail` dipakai sebagai nilai awal non-kontrol agar field tetap
            terkontrol (`email`) tanpa setState di effect. */}
        <input type="hidden" name="__savedEmail" value={savedEmail} readOnly />
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
            Email<span className="ml-0.5 text-[var(--hafta-red-600)]" aria-hidden="true">*</span>
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
            value={email || savedEmail}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError('email');
            }}
            disabled={isPending}
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

        {/* Password + Lupa kata sandi pada baris label */}
        <PasswordField
          id="password"
          name="password"
          label="Kata Sandi"
          placeholder="Masukkan kata sandi"
          autoComplete="current-password"
          disabled={isPending}
          error={fieldErrors.password}
          onChange={() => clearFieldError('password')}
          hint={
            <Link
              href="/forgot-password"
              className="rounded text-xs font-semibold text-stone-600 underline-offset-2 transition-colors hover:text-[var(--hafta-950)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
            >
              Lupa kata sandi?
            </Link>
          }
        />

        {/* Opsi sesi */}
        <fieldset className="space-y-2 pt-1" disabled={isPending}>
          <legend className="sr-only">Opsi sesi masuk</legend>
          <label
            htmlFor="rememberLogin"
            className="flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-lg text-xs text-stone-700 sm:min-h-0"
          >
            <input
              id="rememberLogin"
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 shrink-0 cursor-pointer rounded border-stone-400 accent-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
            />
            <span>Ingat email saya di perangkat ini</span>
          </label>

          <label
            htmlFor="rememberDevice"
            className="flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-lg text-xs text-stone-700 sm:min-h-0"
          >
            <input
              id="rememberDevice"
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              className="h-4 w-4 shrink-0 cursor-pointer rounded border-stone-400 accent-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
            />
            <span>Pertahankan sesi setelah browser ditutup</span>
          </label>
        </fieldset>

        {/* Tombol Masuk Utama */}
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
                <span>Memproses...</span>
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </div>

        {/* Link Buat Akun Berkontras Jelas */}
        <p className="pt-2 text-center text-xs text-stone-600 sm:text-sm">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="rounded px-1 py-0.5 font-bold text-[var(--hafta-950)] underline decoration-[var(--hafta-org-300)] decoration-2 underline-offset-4 transition-colors hover:bg-[var(--hafta-org-100)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
          >
            Buat akun
          </Link>
        </p>
      </form>

      {/* Bantuan menonaktif tombol: kecil, tidak bersaing dengan CTA */}
      <p className="mt-4 text-center text-[11px] text-stone-500">
        Butuh bantuan masuk?{' '}
        <a
          href="https://wa.me/6281232932872?text=Halo%20Admin%20Hafta%20Fisioterapi,%20saya%20butuh%20bantuan%20masuk%20ke%20akun%20pasien."
          target="_blank"
          rel="noopener noreferrer"
          className="rounded font-medium text-stone-700 underline underline-offset-2 hover:text-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-org-300)]"
        >
          Hubungi admin
        </a>
      </p>
    </div>
  );
}
