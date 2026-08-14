'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { AuthAlert } from '@/components/auth/auth-alert';
import { signIn } from '@/lib/auth/client';
import Image from 'next/image';

type LoginError = {
  message: string;
  type: 'error' | 'success';
};

const REMEMBER_EMAIL_KEY = 'hafta_remembered_email';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<LoginError | null>(null);
  const [remember, setRemember] = useState(
    () => typeof window !== 'undefined' && Boolean(window.localStorage.getItem(REMEMBER_EMAIL_KEY)),
  );

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email) {
      setError({ message: 'Email wajib diisi.', type: 'error' });
      return;
    }

    if (!password) {
      setError({ message: 'Kata sandi wajib diisi.', type: 'error' });
      return;
    }

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
            setError({
              message: 'Email belum diverifikasi. Silakan cek inbox Anda untuk link verifikasi.',
              type: 'error',
            });
            return;
          }

          setError({
            message: 'Email atau kata sandi tidak sesuai.',
            type: 'error',
          });
          return;
        }

        router.push('/dashboard');
        router.refresh();
        persistEmail(email);
      } catch {
        setError({
          message: 'Terjadi kesalahan server. Silakan coba lagi.',
          type: 'error',
        });
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <span className="text-2xl font-semibold py-6 items-start block">Masuk Ke Akun Anda.</span>
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
          placeholder="Masukkan kata sandi"
          autoComplete="current-password"
          disabled={isPending}
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Simpan data login
          </label>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Lupa kata sandi?
          </Link>
        </div>

        <Button type="submit" className="h-10 w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Memproses...
            </>
          ) : (
            'Masuk'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Buat akun
          </Link>
        </p>
      </form>
    </>
  );
}
