'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { reviewPatientIntake } from '@/server/actions/intake-review';

type IntakeReviewActionsProps = {
  patientId: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_REVISION' | 'ACCEPTED' | 'DRAFT' | 'ARCHIVED';
  canReview: boolean;
  canRequestRevision: boolean;
  canAccept: boolean;
};

export function IntakeReviewActions({
  patientId,
  status,
  canReview,
  canRequestRevision,
  canAccept,
}: IntakeReviewActionsProps) {
  const [pending, startTransition] = useTransition();
  const [reviewMessage, setReviewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(action: 'start-review' | 'request-revision' | 'accept') {
    setError(null);
    startTransition(async () => {
      try {
        await reviewPatientIntake({ patientId, action, reviewMessage });
        router.refresh();
      } catch {
        setError('Aksi tidak dapat dilakukan. Periksa status intake dan wewenang Anda.');
      }
    });
  }

  if (status === 'SUBMITTED' && canReview)
    return (
      <div className="space-y-3">
        <Button
          disabled={pending}
          onClick={() => run('start-review')}
          className="rounded-xl bg-[var(--hafta-ylw-400)] hover:bg-[var(--hafta-ylw-300)] text-white font-semibold"
        >
          {pending ? 'Memproses...' : 'Mulai Tinjau'}
        </Button>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    );
  if (status !== 'UNDER_REVIEW') return null;
  return (
    <div className="space-y-4 rounded-xl border border-[#E9E2D8] bg-white p-5">
      <div>
        <p className="font-semibold text-[#1F2937]">Keputusan Review</p>
        <p className="mt-1 text-sm text-[#6B7280]">
          Pesan perbaikan akan dapat dilihat pasien. Jangan masukkan catatan internal.
        </p>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {canRequestRevision ? (
        <div className="space-y-2">
          <label htmlFor="reviewMessage" className="text-sm font-semibold text-[#1F2937]">
            Pesan perbaikan untuk pasien
          </label>
          <textarea
            id="reviewMessage"
            value={reviewMessage}
            onChange={(event) => setReviewMessage(event.target.value)}
            disabled={pending}
            rows={4}
            className="flex min-h-[6rem] w-full resize-none rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] px-3.5 py-2.5 text-sm leading-relaxed text-[#1F2937] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[var(--hafta-ylw-400)] focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-400)]/20 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
          />
        </div>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {canRequestRevision ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => run('request-revision')}
            className="rounded-xl border border-[#E9E2D8] bg-white text-[#1F2937] hover:bg-[#FFF7ED]/50 hover:text-[var(--hafta-ylw-400)]"
          >
            Minta Perbaikan
          </Button>
        ) : null}
        {canAccept ? (
          <Button
            disabled={pending}
            onClick={() => run('accept')}
            className="rounded-xl bg-[var(--hafta-ylw-400)] hover:bg-[var(--hafta-ylw-300)] text-white font-semibold"
          >
            {pending ? 'Memproses...' : 'Terima Form Awal'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
