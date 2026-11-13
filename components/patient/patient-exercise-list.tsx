'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarDays, Dumbbell, Repeat2, Timer, TrendingUp } from 'lucide-react';
import type { HomeProgramItemView, HomeProgramView } from '@/server/queries/home-programs';

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function ExerciseMeta({ item }: { item: HomeProgramItemView }) {
  const chips: string[] = [];
  if (item.sets) chips.push(`${item.sets} set`);
  if (item.repetitions) chips.push(`${item.repetitions} repetisi`);
  if (item.durationSeconds) {
    const seconds = item.durationSeconds;
    chips.push(seconds % 60 === 0 ? `${seconds / 60} menit` : `${seconds} detik`);
  }

  return (
    <div className="mt-3 space-y-2">
      {chips.length > 0 || item.frequencyText ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 rounded-full bg-[#F4F4F1] px-2.5 py-1 text-[10px] font-semibold text-stone-600"
            >
              <Repeat2 className="h-3 w-3" />
              {chip}
            </span>
          ))}
          {item.frequencyText ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F4F1] px-2.5 py-1 text-[10px] font-semibold text-stone-600">
              <Timer className="h-3 w-3" />
              {item.frequencyText}
            </span>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-stone-600">{item.instruction}</p>

      {item.precaution ? (
        <p className="flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{item.precaution}</span>
        </p>
      ) : null}
    </div>
  );
}

export function PatientExerciseList({ program }: { program: HomeProgramView | null }) {
  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white px-5 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
          <Dumbbell className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-base font-bold text-[#181700]">Belum ada program latihan aktif</h2>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-stone-500">
          Fisioterapis Anda belum membagikan program latihan mandiri. Program akan muncul di sini
          setelah dibuat dan diaktifkan.
        </p>
        <Link
          href="/dashboard/appointments"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)]"
        >
          <CalendarDays className="h-4 w-4" />
          Lihat Jadwal Terapi
        </Link>
      </div>
    );
  }

  const startsAt = formatDate(program.startsAt);
  const endsAt = formatDate(program.endsAt);

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              Program Aktif
            </p>
            <h2 className="mt-1 text-base font-bold text-[#181700]">Program Latihan Mandiri</h2>
            <p className="mt-1 text-xs text-stone-500">
              {program.items.length} latihan · dibagikan oleh fisioterapis Anda
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] px-3 py-1 text-[11px] font-bold text-[var(--hafta-grn-700)]">
            <TrendingUp className="h-3.5 w-3.5" />
            Aktif
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl bg-[#FAFAF8] px-3.5 py-3 text-[11px] text-stone-600">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-stone-400" />
            {startsAt ? `Mulai ${startsAt}` : 'Tanggal mulai belum ditentukan'}
          </span>
          {endsAt ? (
            <span className="inline-flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-stone-400" />
              Sampai {endsAt}
            </span>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#181700]">Daftar Latihan</h3>
        {program.items.map((item, index) => (
          <article
            key={item.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-org-100)] text-xs font-extrabold text-[#181700]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#181700]">{item.name}</h4>
                <ExerciseMeta item={item} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className="rounded-2xl border border-stone-200 bg-[#FAFAF8] px-4 py-3 text-[11px] leading-relaxed text-stone-500">
        Hentikan latihan jika muncul nyeri tajam, pusing, atau keluhan baru, lalu hubungi
        fisioterapis Anda. Program ini bersifat panduan dan bukan pengganti evaluasi klinis.
      </p>
    </div>
  );
}
