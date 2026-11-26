'use client';

/**
 * Peta kondisi tubuh — siluet manusia (inline SVG, tanpa gambar/3D) dengan
 * penanda area yang muncul otomatis dari kata kunci diagnosis/anamnesis.
 * Ringan: ~3KB markup, animasi CSS saja, hormat prefers-reduced-motion.
 */

export type BodyRegionKey =
  'kepala' | 'leher' | 'bahu' | 'lengan' | 'dada' | 'perut' | 'punggung' | 'pinggul' | 'lutut' | 'kaki';

type Tone = 'good' | 'watch' | 'alert';

/** Posisi penanda area dalam viewBox 200×380 (tampak depan) + label tampilan. */
export const REGION_POINTS: Record<BodyRegionKey, { x: number; y: number; label: string }> = {
  kepala: { x: 100, y: 30, label: 'Kepala' },
  leher: { x: 100, y: 58, label: 'Leher' },
  bahu: { x: 76, y: 80, label: 'Bahu' },
  lengan: { x: 49, y: 122, label: 'Lengan' },
  dada: { x: 100, y: 108, label: 'Dada' },
  perut: { x: 100, y: 152, label: 'Perut' },
  punggung: { x: 134, y: 134, label: 'Punggung' },
  pinggul: { x: 100, y: 208, label: 'Pinggul' },
  lutut: { x: 84, y: 286, label: 'Lutut' },
  kaki: { x: 114, y: 340, label: 'Kaki & pergelangan' },
};

/**
 * Kata kunci Indonesia/istilah klinis → area tubuh.
 *  Aturan: kata umum yang muncul sebagai KONTEKS (bukan keluhan) tidak dipakai —
 *  mis. "postur", "core", atau "kepala" pada frasa "postur kepala maju".
 *  Area hanya ditandai bila benar-benar dikeluhkan/diperiksa. */
const REGION_KEYWORDS: Record<BodyRegionKey, string[]> = {
  kepala: ['sakit kepala', 'nyeri kepala', 'migrain', 'vertigo', 'pusing', 'trauma kepala', ' TBI ', 'concussion'],
  leher: ['leher', 'cervical', 'servikal', 'torticollis', 'whiplash'],
  bahu: ['bahu', 'shoulder', 'rotator', 'impingement', 'frozen shoulder'],
  lengan: [
    'siku',
    'elbow',
    'pergelangan tangan',
    'wrist',
    'karpal',
    'carpal',
    'epikondilitis',
    'tennis elbow',
    'nyeri lengan',
    'kesemutan lengan',
  ],
  dada: ['dada', 'chest', 'sesak', 'pernapasan', 'nyeri dada'],
  perut: ['perut', 'abdomen', 'diastasis', 'nyeri perut'],
  punggung: [
    'punggung',
    'back',
    'lumbar',
    'lumbal',
    'tulang belakang',
    'spine',
    'sciatica',
    'iskias',
    'hernia nucleus',
    'HNP',
    'myalgia belakang',
  ],
  pinggul: ['pinggul', 'hip', 'pelvis', 'panggul', 'sakrum', 'sacroiliac', 'SI joint'],
  lutut: ['lutut', 'knee', 'meniskus', 'patella', 'osteoarthritis lutut', 'OA lutut', ' ACL ', 'PCL'],
  kaki: ['kaki', 'pergelangan kaki', 'ankle', 'telapak', 'plantar', 'tumit', 'heel', 'fasciitis', 'achilles', 'tarsal'],
};

const TONE_DOT: Record<Tone, string> = {
  good: 'bg-[var(--hafta-grn-500)]',
  watch: 'bg-[var(--hafta-300)]',
  alert: 'bg-[var(--hafta-red-500)]',
};

const TONE_HALO: Record<Tone, string> = {
  good: 'bg-[var(--hafta-grn-500)]/25',
  watch: 'bg-[var(--hafta-300)]/25',
  alert: 'bg-[var(--hafta-red-500)]/25',
};

/** Area tubuh yang terdeteksi + sisi yang disebut dalam keluhan (bila ada). */
export type DetectedRegion = {
  key: BodyRegionKey;
  side: 'kiri' | 'kanan' | null;
};

/**
 * Deteksi area tubuh dari teks bebas (diagnosis/anamnesis/pemeriksaan).
 * Bila kata "kiri"/"kanan" muncul dekat kata kunci area, sisi ikut dicatat
 * supaya penanda diletakkan pada sisi tubuh yang benar (tampilan depan:
 * kanan pasien = kiri gambar).
 */
export function detectBodyRegions(...texts: Array<string | null | undefined>): DetectedRegion[] {
  const haystack = ` ${texts.filter(Boolean).join(' ').toLowerCase()} `;
  const detected: DetectedRegion[] = [];
  for (const key of Object.keys(REGION_KEYWORDS) as BodyRegionKey[]) {
    const match = REGION_KEYWORDS[key].find((word) => haystack.includes(word.toLowerCase()));
    if (!match) continue;
    const at = haystack.indexOf(match.toLowerCase());
    // Sisi hanya dibaca dalam KALIMAT yang sama — mencegah "bahu kiri" pada
    // kalimat sebelumnya mencemari sisi area lain (mis. leher/lutut).
    const boundary = Math.max(
      haystack.lastIndexOf('.', at),
      haystack.lastIndexOf(';', at),
      haystack.lastIndexOf('!', at),
      haystack.lastIndexOf('?', at),
    );
    const segStart = boundary + 1;
    const nextDots = ['.', ';', '!', '?']
      .map((ch) => haystack.indexOf(ch, at + match.length))
      .filter((index) => index !== -1);
    const segment = haystack.slice(segStart, nextDots.length ? Math.min(...nextDots) : haystack.length);
    const kiriAt = segment.search(/\bkiri\b/);
    const kananAt = segment.search(/\bkanan\b/);
    const side =
      kiriAt === -1
        ? kananAt === -1
          ? null
          : 'kanan'
        : kananAt === -1
          ? 'kiri'
          : kiriAt <= kananAt
            ? 'kiri'
            : 'kanan';
    detected.push({ key, side });
  }
  return detected;
}

export function BodyConditionMap({
  markers,
  tone,
  onSelectRegion,
  fallbackHint,
}: {
  markers: BodyRegionKey[];
  tone: Tone;
  onSelectRegion?: (region: BodyRegionKey) => void;
  fallbackHint: string;
}) {
  return (
    <div className="min-w-0">
      <div className="relative mx-auto aspect-[200/380] w-full max-w-[220px]">
        {/* Siluet manusia — flat, satu tone, tanpa detail anatomi berat. */}
        <svg viewBox="0 0 200 380" className="h-full w-full" role="img" aria-label="Siluet tubuh manusia" fill="none">
          <g fill="var(--hafta-100)" stroke="var(--hafta-200)" strokeWidth="1">
            <ellipse cx="100" cy="32" rx="21" ry="25" />
            <rect x="91" y="54" width="18" height="13" rx="6" />
            <path d="M68 74c0-6 6-9 13-9h38c7 0 13 3 13 9l5 66c1 20-6 38-8 54h-58c-2-16-9-34-8-54l5-66Z" />
            <rect x="70" y="192" width="60" height="36" rx="15" />
            <rect x="40" y="82" width="16" height="88" rx="8" transform="rotate(7 48 82)" />
            <rect x="144" y="82" width="16" height="88" rx="8" transform="rotate(-7 152 82)" />
            <rect x="74" y="226" width="19" height="108" rx="9.5" />
            <rect x="107" y="226" width="19" height="108" rx="9.5" />
            <ellipse cx="83" cy="344" rx="13" ry="7" />
            <ellipse cx="117" cy="344" rx="13" ry="7" />
          </g>
        </svg>

        {/* Penanda area — tombol HTML asli (fokus & target sentuh terjamin). */}
        {markers.map((region) => {
          const point = REGION_POINTS[region];
          const left = `${(point.x / 200) * 100}%`;
          const top = `${(point.y / 380) * 100}%`;
          return (
            <button
              key={region}
              type="button"
              onClick={onSelectRegion ? () => onSelectRegion(region) : undefined}
              aria-label={`${point.label} — lihat catatan sesi`}
              className="group absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/50"
              style={{ left, top }}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full motion-safe:animate-ping ${TONE_HALO[tone]}`}
              />
              <span
                aria-hidden="true"
                className={`relative h-2.5 w-2.5 rounded-full ring-2 ring-white ${TONE_DOT[tone]}`}
              />
              <span className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--hafta-950)] px-2 py-0.5 text-[9px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {point.label}
              </span>
            </button>
          );
        })}
      </div>

      {markers.length > 0 ? (
        <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
          {markers.map((region) => (
            <li
              key={region}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground"
            >
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />
              {REGION_POINTS[region].label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">{fallbackHint}</p>
      )}
    </div>
  );
}
