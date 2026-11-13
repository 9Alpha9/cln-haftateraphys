'use client';

import { useState, useTransition } from 'react';
import { BadgeCheck, Mail, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useToast } from '@/components/ui/toast';

export function EmailVerificationCard({
  email,
  verified,
}: {
  email: string;
  verified: boolean;
}) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function resend() {
    startTransition(async () => {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: '/dashboard/profile?tab=keamanan',
      });

      if (result?.error) {
        showToast(
          'error',
          result.error.message ?? 'Email verifikasi tidak dapat dikirim saat ini.',
        );
        return;
      }

      setSent(true);
      showToast('success', 'Email verifikasi telah dikirim.');
    });
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={
              verified
                ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-org-50)] text-[#181700]'
            }
          >
            {verified ? <BadgeCheck className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#181700]">Verifikasi Email</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {verified
                ? `Email ${email} sudah terverifikasi.`
                : `Email ${email} belum diverifikasi. Verifikasi membantu mengamankan akun dan pemulihan kata sandi.`}
            </p>
          </div>
        </div>

        {!verified ? (
          <button
            type="button"
            onClick={resend}
            disabled={pending || sent}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-org-100)] px-4 text-[11px] font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {sent ? 'Email terkirim' : 'Kirim verifikasi'}
          </button>
        ) : (
          <span className="inline-flex h-8 w-fit items-center gap-1 rounded-full border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] px-3 text-[10px] font-bold text-[var(--hafta-grn-700)]">
            <BadgeCheck className="h-3.5 w-3.5" />
            Terverifikasi
          </span>
        )}
      </div>
    </div>
  );
}
