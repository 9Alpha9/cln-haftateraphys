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
        <Button disabled={pending} onClick={() => run('start-review')}>
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
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <p className="font-semibold text-foreground">Keputusan Review</p>
        <p className="mt-1 text-sm text-muted-foreground">
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
          <label htmlFor="reviewMessage" className="text-sm font-medium text-foreground">
            Pesan perbaikan untuk pasien
          </label>
          <textarea
            id="reviewMessage"
            value={reviewMessage}
            onChange={(event) => setReviewMessage(event.target.value)}
            disabled={pending}
            className="flex min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {canRequestRevision ? (
          <Button variant="outline" disabled={pending} onClick={() => run('request-revision')}>
            Minta Perbaikan
          </Button>
        ) : null}
        {canAccept ? (
          <Button disabled={pending} onClick={() => run('accept')}>
            {pending ? 'Memproses...' : 'Terima Form Awal'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
