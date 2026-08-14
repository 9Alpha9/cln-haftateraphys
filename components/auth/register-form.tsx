'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { AuthAlert } from '@/components/auth/auth-alert';
import { signUp } from '@/lib/auth/client';
import Image from 'next/image';

type FormError = {
  message: string;
  type: 'error' | 'success';
};

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<FormError | null>(null);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');
    const termsAccepted = formData.get('terms') === 'on';

    if (!name) {
      setError({ message: 'Nama wajib diisi.', type: 'error' });
      return;
    }

    if (!email) {
      setError({ message: 'Email wajib diisi.', type: 'error' });
      return;
    }

    if (password.length < 8) {
      setError({
        message: 'Kata sandi minimal 8 karakter.',
        type: 'error',
      });
      return;
    }

    if (password !== confirmPassword) {
      setError({ message: 'Konfirmasi kata sandi tidak cocok.', type: 'error' });
      return;
    }

    if (!termsAccepted) {
      setError({
        message: 'Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi.',
        type: 'error',
      });
      return;
    }

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
            setError({
              message: 'Email atau kata sandi tidak sesuai.',
              type: 'error',
            });
            return;
          }

          setError({
            message: 'Terjadi kesalahan. Silakan coba lagi.',
            type: 'error',
          });
          return;
        }

        setRegistered(true);
      } catch {
        setError({
          message: 'Terjadi kesalahan server. Silakan coba lagi.',
          type: 'error',
        });
      }
    });
  }

  if (registered) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <MailCheck className="size-7 text-success" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Pendaftaran berhasil!</h2>
        <p className="text-sm text-muted-foreground">
          Kami telah mengirimkan email verifikasi ke alamat email Anda. Silakan cek inbox dan klik link verifikasi untuk
          mengaktifkan akun.
        </p>
        <Link
          href="/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-input bg-background text-sm font-medium transition-colors hover:bg-muted"
        >
          Kembali ke Halaman Masuk
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <span className="text-2xl font-semibold py-6 items-start block">Daftar Akun.</span>
      </div>
      <div className="flex flex-col justify-center items-center gap-6">
        <Image
          src="/images/logos/logos-text.png"
          alt="Hafta Fisioterapi"
          width={192}
          height={128}
          priority
          className="h-32 w-auto"
        />
      </div>
      {error && <AuthAlert type={error.type} message={error.message} />}
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Masukkan nama lengkap"
          required
          autoComplete="name"
          disabled={isPending}
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          required
          autoComplete="email"
          disabled={isPending}
          className="h-10"
        />
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Kata Sandi"
        placeholder="Minimal 8 karakter"
        autoComplete="new-password"
        disabled={isPending}
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Konfirmasi Kata Sandi"
        placeholder="Ulangi kata sandi"
        autoComplete="new-password"
        disabled={isPending}
      />

      <div className="space-y-3">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="terms"
            className="mt-0.5 size-4 rounded border-input accent-primary"
            disabled={isPending}
          />
          <span className="text-muted-foreground">
            Saya menyetujui{' '}
            <a href="/terms" className="underline hover:text-foreground">
              Syarat & Ketentuan
            </a>{' '}
            dan{' '}
            <a href="/privacy" className="underline hover:text-foreground">
              Kebijakan Privasi
            </a>
          </span>
        </label>
      </div>

      <Button type="submit" className="h-10 w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Memproses...
          </>
        ) : (
          'Buat Akun'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
