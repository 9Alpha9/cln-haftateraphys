'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { AuthAlert } from '@/components/auth/auth-alert';
import { authClient } from '@/lib/auth/client';

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();

    if (!email) {
      setError('Alamat email wajib diisi.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result?.error) {
        setError(
          result.error.message ??
            'Permintaan reset tidak dapat diproses. Coba lagi beberapa saat lagi.',
        );
        return;
      }

      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hafta-org-100)] text-[#181700]">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#181700]">Periksa email Anda</h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Jika alamat email terdaftar, kami telah mengirim tautan untuk mengatur ulang kata sandi.
          Tautan berlaku selama 1 jam.
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--hafta-org-100)] px-5 text-sm font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)]"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-[#181700] sm:text-3xl">
          Lupa Kata Sandi
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Masukkan alamat email akun Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi.
        </p>
      </div>

      {error ? (
        <div className="mb-5">
          <AuthAlert type="error" message={error} />
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
            Alamat Email
          </Label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={pending}
            placeholder="nama@email.com"
            className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-[#181700] transition-all duration-200 placeholder:text-stone-400 hover:border-stone-400 focus:border-[#181700] focus:outline-none focus:ring-4 focus:ring-[var(--hafta-org-200)]/30 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--hafta-org-100)] text-sm font-bold text-[#181700] transition-all duration-200 hover:bg-[var(--hafta-org-200)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Kirim Tautan Reset
        </button>
      </form>

      <p className="mt-5 text-xs text-stone-500">
        Ingat kata sandi?{' '}
        <Link href="/login" className="font-bold text-[#181700] underline underline-offset-2">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
