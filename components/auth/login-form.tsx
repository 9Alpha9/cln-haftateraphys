'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { AuthAlert } from '@/components/auth/auth-alert';
import { signIn } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

type FieldErrors = {
  email?: string;
  password?: string;
};

const REMEMBER_EMAIL_KEY = 'hafta_remembered_email';
const REMEMBER_ME_KEY = 'hafta_remember_me';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [remember, setRemember] = useState(
    () => typeof window !== 'undefined' && Boolean(window.localStorage.getItem(REMEMBER_EMAIL_KEY)),
  );
  const [rememberDevice, setRememberDevice] = useState(false);

  const reason = searchParams.get('reason');

  const reasonBanner =
    reason === 'idle'
      ? 'Sesi Anda telah dikunci otomatis karena tidak ada aktivitas untuk melindungi kerahasiaan data medis. Silakan masuk kembali.'
      : reason === 'closed'
        ? 'Sesi sebelumnya telah berakhir saat browser ditutup. Silakan masuk kembali untuk melanjutkan.'
        : null;

  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
    const input = document.getElementById('email') as HTMLInputElement | null;
    if (saved && input) input.value = saved;
  }, []);

  const persistEmail = (email: string) => {
    if (remember) {
      window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
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
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    const errors: FieldErrors = {};

    if (!email) {
      errors.email = 'Alamat email wajib diisi.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Format alamat email tidak valid (contoh: nama@email.com).';
    }

    if (!password) {
      errors.password = 'Kata sandi wajib diisi.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      try {
        const result = await signIn.email({
          email,
          password,
          callbackURL: '/dashboard',
        });

        if (result?.error) {
          const errData = result.error as { message?: string; code?: string };

          if (errData?.code === 'EMAIL_NOT_VERIFIED') {
            setGeneralError(
              'Email Anda belum diverifikasi. Silakan periksa inbox atau spam untuk tautan verifikasi.'
            );
            return;
          }

          // Kredensial tidak cocok: tandai field email dan password sebagai error spesifik
          setFieldErrors({
            email: 'Periksa kembali email Anda.',
            password: 'Kata sandi tidak sesuai dengan email yang dimasukkan.',
          });
          return;
        }

        router.push('/dashboard');
        router.refresh();
        persistEmail(email);
        persistRememberDevice();
      } catch {
        setFieldErrors({
          email: 'Terjadi kendala pada server.',
          password: 'Silakan coba beberapa saat lagi.',
        });
      }
    });
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
          Masuk ke Akun Anda
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Pantau jadwal sesi, catatan perkembangan terapi, dan program latihan mandiri Anda.
        </p>
      </div>

      {generalError && (
        <div className="mb-5">
          <AuthAlert type="error" message={generalError} />
        </div>
      )}

      {reasonBanner && (
        <div className="mb-6">
          <div className="rounded-2xl bg-[var(--hafta-ylw-50)]/80 border border-[var(--hafta-ylw-200)] px-4 py-3 text-xs text-[#181700] flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#181700]" />
            <span>{reasonBanner}</span>
          </div>
        </div>
      )}

      {/* ── FORM INPUT ── */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
            Email
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

        {/* Password */}
        <div className="space-y-1.5">
          <PasswordField
            id="password"
            name="password"
            label="Kata Sandi"
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            disabled={isPending}
            error={fieldErrors.password}
          />
        </div>

        {/* Baris Checkbox Simpan & Ingat Perangkat */}
        <div className="flex flex-col gap-2 pt-1 text-xs">
          <label htmlFor="rememberLogin" className="flex items-center gap-2 text-stone-600 cursor-pointer select-none">
            <input
              id="rememberLogin"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-stone-300 accent-[#181700] cursor-pointer"
            />
            <span>Simpan data login</span>
          </label>

          <label htmlFor="rememberDevice" className="flex items-center gap-2 text-stone-600 cursor-pointer select-none">
            <input
              id="rememberDevice"
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded-md border-stone-300 text-[#181700] focus:ring-[#f7f000]/30 cursor-pointer"
            />
            <span>Ingat perangkat ini selama 7 hari</span>
          </label>

          <a
            href="https://wa.me/6281232932872?text=Halo%20Admin%20Hafta%20Fisioterapi,%20saya%20butuh%20bantuan%20reset%20kata%20sandi%20akun%20pasien."
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-stone-600 hover:text-[#181700] transition-colors"
          >
            Lupa kata sandi?
          </a>
        </div>

        {/* Tombol Masuk Utama */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] text-sm font-bold text-[#181700] shadow-xs transition-all duration-200 hover:bg-[var(--hafta-ylw-200)] hover:shadow-md active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
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
            className="rounded px-1.5 py-0.5 font-bold text-[#181700] underline decoration-[var(--hafta-ylw-100)] decoration-2 underline-offset-4 transition-all hover:bg-[var(--hafta-ylw-100)]/40"
          >
            Buat akun
          </Link>
        </p>
      </form>
    </div>
  );
}
