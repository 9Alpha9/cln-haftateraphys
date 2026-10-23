export type FeaturableReview = {
  authorName: string;
  profilePhotoUrl: string | null;
  rating: number;
  relativeTimeDescription: string;
  text: string;
};

export type FeaturableReviewsData = {
  rating: number;
  userRatingCount: number;
  writeAReviewUri: string | null;
  reviews: FeaturableReview[];
  isLive: boolean;
};

type RawReview = {
  author?: { name?: string; avatarUrl?: string };
  reviewer?: { displayName?: string; profilePhotoUrl?: string };
  author_name?: string;
  profile_photo_url?: string;
  rating?: { value?: number } | number;
  starRating?: number;
  text?: string;
  originalText?: string;
  comment?: string;
  publishedAt?: string;
  createTime?: string;
};

type FeaturableResponse = {
  reviews?: RawReview[];
  widget?: {
    reviews?: RawReview[];
    gbpLocationSummary?: {
      reviewsCount?: number;
      rating?: number;
      writeAReviewUri?: string;
    };
  };
};

const fallbackReviews: FeaturableReview[] = [
  {
    authorName: 'Bpk. H',
    profilePhotoUrl: null,
    rating: 5,
    relativeTimeDescription: 'Ulasan pasien',
    text: 'Setelah beberapa sesi terapi, nyeri punggung saya berangsur membaik. Terapis menjelaskan setiap proses dengan sabar dan mudah dipahami.',
  },
  {
    authorName: 'Kak R',
    profilePhotoUrl: null,
    rating: 5,
    relativeTimeDescription: 'Ulasan pasien',
    text: 'Program rehabilitasi terasa terarah. Saya bisa memantau perkembangan dan kembali beraktivitas dengan lebih percaya diri.',
  },
  {
    authorName: 'Ibu M',
    profilePhotoUrl: null,
    rating: 5,
    relativeTimeDescription: 'Ulasan pasien',
    text: 'Pendampingan selama terapi sangat membantu. Program latihan mudah dipahami dan bisa dilanjutkan dengan nyaman di rumah.',
  },
];

function formatRelativeTime(value?: string): string {
  if (!value) return 'Ulasan Google';
  const date = new Date(value);
  const difference = Date.now() - date.getTime();
  if (Number.isNaN(date.getTime()) || difference < 0) return value;

  const minutes = Math.floor(difference / 60_000);
  const hours = Math.floor(difference / 3_600_000);
  const days = Math.floor(difference / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  if (weeks < 5) return `${weeks} minggu lalu`;
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
}

function fallbackData(): FeaturableReviewsData {
  return {
    rating: 5,
    userRatingCount: 18,
    writeAReviewUri: 'https://maps.google.com/?cid=12369378807636462729',
    reviews: fallbackReviews,
    isLive: false,
  };
}

function buildFeaturableUrl(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanId = trimmed.replace(/^widgets\//, '').replace(/\/$/, '');
  return `https://featurable.com/api/v2/widgets/${cleanId}`;
}

export async function getFeaturableReviews(): Promise<FeaturableReviewsData> {
  const widgetId = process.env.FEATURABLE_WIDGET_ID || process.env.NEXT_PUBLIC_FEATURABLE_WIDGET_ID;

  if (!widgetId) return fallbackData();

  try {
    const url = buildFeaturableUrl(widgetId);
    const response = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return fallbackData();

    const data = (await response.json()) as FeaturableResponse;
    const rawReviews = data?.reviews || data?.widget?.reviews || [];

    const reviews = rawReviews
      .map((review): FeaturableReview | null => {
        const authorName =
          review.author?.name || review.reviewer?.displayName || review.author_name || 'Pasien Hafta';
        const profilePhotoUrl =
          review.author?.avatarUrl || review.reviewer?.profilePhotoUrl || review.profile_photo_url || null;
        const rating =
          typeof review.rating === 'number'
            ? review.rating
            : review.rating?.value ?? review.starRating ?? 5;
        const text = (review.originalText || review.text || review.comment || '').trim();

        if (!text || rating < 4) return null;

        return {
          authorName,
          profilePhotoUrl,
          rating: Math.min(5, Math.max(0, rating)),
          relativeTimeDescription: formatRelativeTime(review.publishedAt || review.createTime),
          text,
        };
      })
      .filter((review): review is FeaturableReview => review !== null);

    const summary = data?.widget?.gbpLocationSummary;
    const overallRating = summary?.rating ?? 5;
    const totalCount = summary?.reviewsCount ?? reviews.length;
    const writeUri = summary?.writeAReviewUri ?? 'https://maps.google.com/?cid=12369378807636462729';

    return reviews.length
      ? {
          rating: overallRating,
          userRatingCount: totalCount,
          writeAReviewUri: writeUri,
          reviews,
          isLive: true,
        }
      : fallbackData();
  } catch {
    return fallbackData();
  }
}
