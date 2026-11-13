'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { PasswordField } from '@/components/auth/password-field';
import { AuthAlert } from '@/components/auth/auth-alert';
import { authClient } from '@/lib/auth/client';

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#181700]">Tautan Tidak Valid</h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Tautan reset kata sandi tidak ditemukan atau sudah kedaluwarsa. Silakan minta tautan baru.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--hafta-org-100)] px-5 text-sm font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)]"
        >
          Minta Tautan Baru
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#181700]">Kata Sandi Diperbarui</h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Kata sandi Anda berhasil diubah. Silakan masuk kembali dengan kata sandi baru.
        </p>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--hafta-org-100)] px-5 text-sm font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)]"
        >
          Masuk ke Akun
        </button>
      </div>
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (password.length < 8) {
      setFieldError('Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setFieldError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setError(null);
    setFieldError(null);
    startTransition(async () => {
      const result = await authClient.resetPassword({ newPassword: password, token });

      if (result?.error) {
        setError(
          result.error.message ??
            'Kata sandi tidak dapat diubah. Tautan mungkin sudah kedaluwarsa.',
        );
        return;
      }

      setSuccess(true);
    });
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-[#181700] sm:text-3xl">
          Atur Ulang Kata Sandi
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Masukkan kata sandi baru untuk akun Hafta Fisioterapi Anda.
        </p>
      </div>

      {error ? (
        <div className="mb-5">
          <AuthAlert type="error" message={error} />
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <PasswordField
          id="password"
          name="password"
          label="Kata Sandi Baru"
          placeholder="Min. 8 karakter"
          autoComplete="new-password"
          disabled={pending}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Konfirmasi Kata Sandi Baru"
          placeholder="Ulangi kata sandi"
          autoComplete="new-password"
          disabled={pending}
          error={fieldError ?? undefined}
        />

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--hafta-org-100)] text-sm font-bold text-[#181700] transition-all duration-200 hover:bg-[var(--hafta-org-200)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Simpan Kata Sandi Baru
        </button>
      </form>
    </div>
  );
}
