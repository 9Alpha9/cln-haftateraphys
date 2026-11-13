'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { KeyRound, Loader2, ShieldCheck, Copy, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth/client';

type Stage = 'idle' | 'password' | 'verify' | 'recovery' | 'disable';

export function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [totpURI, setTotpURI] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  function startEnable() {
    setStage('password');
    setPassword('');
    setOpen(true);
  }

  function beginEnable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await authClient.twoFactor.enable({ password });
      if (result.error) {
        showToast('error', result.error.message ?? '2FA tidak dapat diaktifkan.');
        return;
      }
      const data = result.data as { totpURI?: string; backupCodes?: string[] } | undefined;
      setTotpURI(data?.totpURI ?? '');
      setBackupCodes(data?.backupCodes ?? []);
      setStage('verify');
    });
  }

  function confirmCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await authClient.twoFactor.verifyTotp({ code: code.trim() });
      if (result.error) {
        showToast('error', result.error.message ?? 'Kode tidak valid.');
        return;
      }
      setStage('recovery');
      router.refresh();
    });
  }

  function finish() {
    setOpen(false);
    setStage('idle');
    setPassword('');
    setCode('');
    setTotpURI('');
  }

  function beginDisable() {
    setStage('disable');
    setPassword('');
    setOpen(true);
  }

  function confirmDisable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await authClient.twoFactor.disable({ password });
      if (result.error) {
        showToast('error', result.error.message ?? '2FA tidak dapat dinonaktifkan.');
        return;
      }
      setOpen(false);
      setStage('idle');
      setPassword('');
      showToast('success', '2FA dinonaktifkan.');
      router.refresh();
    });
  }

  async function copyCodes() {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
  }

  const secret = (() => {
    try {
      return new URL(totpURI).searchParams.get('secret') ?? '';
    } catch {
      return '';
    }
  })();

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-org-50)] text-[#181700]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#181700]">Autentikasi Dua Faktor (MFA)</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              Gunakan aplikasi authenticator (Google Authenticator, 1Password, Authy) untuk
              mengamankan akun staf.
            </p>
          </div>
        </div>
        {enabled ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex h-8 items-center gap-1 rounded-full border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] px-3 text-[10px] font-bold text-[var(--hafta-grn-700)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aktif
            </span>
            <button
              type="button"
              onClick={beginDisable}
              className="inline-flex h-8 items-center rounded-full border border-stone-200 bg-white px-3 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
            >
              Nonaktifkan
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEnable}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--hafta-org-100)] px-4 text-[11px] font-bold text-[#181700] hover:bg-[var(--hafta-org-200)]"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Aktifkan 2FA
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(value) => (value ? null : finish())}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-3xl p-0">
          <DialogHeader className="border-b border-stone-100 p-5 text-left">
            <DialogTitle className="text-base font-bold text-[#181700]">
              {enabled ? 'Nonaktifkan 2FA' : 'Aktifkan 2FA'}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              {stage === 'recovery'
                ? 'Simpan kode cadangan berikut di tempat aman.'
                : 'Masukkan kata sandi akun Anda untuk melanjutkan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5">
            {stage === 'password' ? (
              <form onSubmit={beginEnable} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mfa-password">Kata Sandi</Label>
                  <Input
                    id="mfa-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={pending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] text-xs font-bold text-[#181700] hover:bg-[var(--hafta-org-200)] disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Lanjutkan
                </button>
              </form>
            ) : null}

            {stage === 'verify' ? (
              <form onSubmit={confirmCode} className="space-y-4">
                {totpURI ? (
                  <div className="flex justify-center rounded-2xl border border-stone-200 bg-white p-4">
                    <QRCodeSVG value={totpURI} size={168} />
                  </div>
                ) : null}
                {secret ? (
                  <p className="break-all rounded-xl bg-[#FAFAF8] px-3 py-2 font-mono text-[11px] text-stone-600">
                    {secret}
                  </p>
                ) : null}
                <p className="text-xs leading-relaxed text-stone-500">
                  Scan QR dengan aplikasi authenticator, lalu masukkan 6 digit kode.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Kode 6 digit</Label>
                  <Input
                    id="mfa-code"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                    required
                    disabled={pending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending || code.length !== 6}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] text-xs font-bold text-[#181700] hover:bg-[var(--hafta-org-200)] disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Verifikasi & Aktifkan
                </button>
              </form>
            ) : null}

            {stage === 'recovery' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#FAFAF8] p-3 font-mono text-[11px] text-stone-700">
                  {backupCodes.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyCodes}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Tersalin' : 'Salin kode'}
                  </button>
                  <button
                    type="button"
                    onClick={finish}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-[var(--hafta-org-100)] text-[11px] font-bold text-[#181700] hover:bg-[var(--hafta-org-200)]"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : null}

            {stage === 'disable' ? (
              <form onSubmit={confirmDisable} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mfa-disable-password">Kata Sandi</Label>
                  <Input
                    id="mfa-disable-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={pending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Nonaktifkan 2FA
                </button>
              </form>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
