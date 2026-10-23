'use client';

import { useState } from 'react';
import { Container } from '@/components/container';
import { Section } from '@/components/section';
import { Marquee } from '@/components/ui/marquee';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import type { FeaturableReview, FeaturableReviewsData } from '@/lib/featurable';
import { Star } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

function ReviewCard({ review }: { review: FeaturableReview }) {
  const [imageError, setImageError] = useState(false);
  const initial = review.authorName.slice(0, 1).toUpperCase();
  const showPhoto = Boolean(review.profilePhotoUrl && !imageError);

  return (
    <article className="relative w-[340px] sm:w-[380px] min-h-[210px] shrink-0 rounded-2xl border border-stone-200/80 bg-white p-6 flex flex-col">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {showPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.profilePhotoUrl!}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="h-10 w-10 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-sm font-bold text-[var(--hafta-ylw-950)]">
                {initial}
              </span>
            )}
            <div>
              <p className="font-bold text-[var(--hafta-ylw-950)] text-sm">{review.authorName}</p>
              <p className="text-xs text-stone-500">{review.relativeTimeDescription}</p>
            </div>
          </div>
          <GoogleIcon />
        </div>

        <div className="mt-4 flex gap-1" aria-label={`${review.rating} dari 5 bintang`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${
                index < review.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-stone-200 text-stone-200'
              }`}
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-stone-600 line-clamp-4">
        &ldquo;{review.text}&rdquo;
      </p>
    </article>
  );
}

export function TestimonialSection({ initialData }: { initialData: FeaturableReviewsData }) {
  const reviews = initialData.reviews;
  const displayReviews =
    reviews.length < 6
      ? [...reviews, ...reviews, ...reviews]
      : [...reviews, ...reviews];

  return (
    <Section className="overflow-hidden bg-[#FEFEF6] border-y border-stone-200/50">
      <Container>
        <ScrollAnimation>
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hafta-ylw-950)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-ylw-100)]" aria-hidden="true" />
              Ulasan Google Review
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--hafta-ylw-950)] md:text-3xl">
              Pengalaman Pasien di Hafta Fisioterapi
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600">
              Ulasan terverifikasi dari pasien yang telah menjalani evaluasi dan terapi bersama kami
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white px-4 py-2 shadow-sm">
                <GoogleIcon />
                <span className="text-sm font-bold text-[var(--hafta-ylw-950)]">
                  {initialData.rating.toFixed(1)}
                </span>
                <div className="flex gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-stone-500">
                  ({initialData.userRatingCount} ulasan Google)
                </span>
              </div>

              <a
                href={initialData.writeAReviewUri || 'https://maps.google.com/?cid=12369378807636462729'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--hafta-ylw-950)] underline decoration-[var(--hafta-ylw-200)] decoration-2 underline-offset-4 hover:decoration-[var(--hafta-ylw-100)]"
              >
                Tulis / Lihat Ulasan di Google
              </a>
            </div>
          </div>
        </ScrollAnimation>
      </Container>

      <div className="mt-10 w-full max-w-[100vw]">
        <Marquee>
          {displayReviews.map((review, index) => (
            <ReviewCard key={`${review.authorName}-${index}`} review={review} />
          ))}
        </Marquee>
      </div>
    </Section>
  );
}
