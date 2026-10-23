'use client';

import React, { useState } from 'react';
import type { FeaturableReview } from '@/lib/featurable';
import { Star } from 'lucide-react';

export function ContactReviewCard({ review }: { review: FeaturableReview }) {
  const [imageError, setImageError] = useState(false);
  const initial = review.authorName.slice(0, 1).toUpperCase();
  const showPhoto = Boolean(review.profilePhotoUrl && !imageError);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-[#FEFEF6] p-6 shadow-xs">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[var(--hafta-ylw-950)]">
            {[...Array(review.rating)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current text-amber-400" />
            ))}
          </div>
          <span className="text-[11px] font-medium text-stone-400">
            {review.relativeTimeDescription}
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-stone-700">
          &ldquo;{review.text}&rdquo;
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-stone-200/60 pt-4">
        {showPhoto ? (
          <img
            src={review.profilePhotoUrl!}
            alt={`Foto profil ${review.authorName}`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="h-10 w-10 shrink-0 rounded-full object-cover shadow-2xs border border-stone-200"
            loading="lazy"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-xs font-bold text-[var(--hafta-ylw-950)]">
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-stone-900">{review.authorName}</p>
          <p className="text-[10px] text-stone-500">Pasien Terverifikasi Google</p>
        </div>
      </div>
    </div>
  );
}
