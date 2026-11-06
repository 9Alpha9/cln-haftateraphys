'use client';

import { useId, useState, useTransition } from 'react';
import {
  CalendarDays,
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Save,
  Target,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/toast';
import { saveTreatmentPlan } from '@/server/actions/treatment-plans';
import type { TreatmentPlanView } from '@/server/queries/treatment-plans';
import { cn } from '@/lib/utils';

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function TreatmentPlanPanel({
  patientId,
  patientName,
  initialPlan,
  canManage,
  onSaved,
}: {
  patientId: string;
  patientName: string;
  initialPlan: TreatmentPlanView | null;
  canManage: boolean;
  onSaved?: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const plan = initialPlan;

  return (
    <>
      {!plan ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white p-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-ylw-50)] text-[#181700]">
            <ClipboardList className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#181700]">Belum ada rencana terapi</p>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            Susun tujuan, intervensi, dan rencana evaluasi untuk pasien ini.
          </p>
          {canManage ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-200)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Rencana Terapi
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-stone-200/70 bg-white p-3.5 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                    plan.status === 'ACTIVE'
                      ? 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                      : 'border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)] text-[#181700]',
                  )}
                >
                  <ClipboardList className="h-3 w-3" />
                  {plan.status === 'ACTIVE' ? 'Aktif' : 'Draft'}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    plan.patientVisible
                      ? 'bg-[#F4F4F1] text-stone-600'
                      : 'bg-amber-50 text-amber-800',
                  )}
                >
                  {plan.patientVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {plan.patientVisible ? 'Terlihat pasien' : 'Internal'}
                </span>
                {plan.reviewAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F4F1] px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                    <CalendarDays className="h-3 w-3" />
                    Review {formatDate(plan.reviewAt)}
                  </span>
                ) : null}
              </div>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-stone-200/90 bg-white px-3 text-[11px] font-semibold text-[#181700] transition-colors hover:bg-stone-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Rencana
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-stone-200/70 bg-white p-3.5">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
                <Target className="h-3.5 w-3.5" />
                Tujuan Terapi
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#181700]">
                {plan.goals}
              </p>
            </div>
            <div className="border-t border-stone-100 pt-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                Rencana Intervensi
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#181700]">
                {plan.interventions}
              </p>
            </div>
            {plan.reviewIntervalText ? (
              <div className="border-t border-stone-100 pt-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                  Interval Evaluasi
                </p>
                <p className="mt-1 text-sm text-[#181700]">{plan.reviewIntervalText}</p>
              </div>
            ) : null}
            {plan.precautions ? (
              <div className="border-t border-stone-100 pt-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                  Precaution / Perhatian
                </p>
                <p className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  {plan.precautions}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {formOpen ? (
        <TreatmentPlanForm
          key={plan?.id ?? 'new'}
          patientId={patientId}
          patientName={patientName}
          plan={plan}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            onSaved?.();
          }}
        />
      ) : null}
    </>
  );
}

function TreatmentPlanForm({
  patientId,
  patientName,
  plan,
  onClose,
  onSaved,
}: {
  patientId: string;
  patientName: string;
  plan: TreatmentPlanView | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const formId = useId();
  const [pending, startTransition] = useTransition();
  const [goals, setGoals] = useState(plan?.goals ?? '');
  const [interventions, setInterventions] = useState(plan?.interventions ?? '');
  const [reviewIntervalText, setReviewIntervalText] = useState(plan?.reviewIntervalText ?? '');
  const [reviewAt, setReviewAt] = useState(
    plan?.reviewAt ? new Date(plan.reviewAt).toISOString().slice(0, 10) : '',
  );
  const [precautions, setPrecautions] = useState(plan?.precautions ?? '');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>(
    plan?.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
  );
  const [patientVisible, setPatientVisible] = useState(plan?.patientVisible ?? true);
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (goals.trim().length < 5 || interventions.trim().length < 5) {
      setError('Tujuan dan rencana intervensi wajib diisi.');
      return;
    }

    startTransition(async () => {
      const result = await saveTreatmentPlan({
        patientId,
        goals,
        interventions,
        reviewIntervalText: reviewIntervalText || undefined,
        reviewAt: reviewAt || undefined,
        precautions: precautions || undefined,
        patientVisible,
        status,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      showToast('success', 'Rencana terapi berhasil disimpan.');
      onSaved();
    });
  }

  return (
    <GlobalSlideOver
      isOpen
      onClose={onClose}
      size="lg"
      icon={<ClipboardList className="h-5 w-5" />}
      title={plan ? 'Edit Rencana Terapi' : 'Buat Rencana Terapi'}
      subtitle={patientName}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="submit"
            form={formId}
            disabled={pending}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-200)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-[13px]"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Rencana
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white px-4 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100 disabled:opacity-60 sm:h-11 sm:px-5 sm:text-[13px]"
          >
            Batal
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4 sm:space-y-5">
        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-stone-600">Tujuan terapi</span>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={3}
            placeholder="Contoh: mengurangi nyeri, meningkatkan ROM, kembali beraktivitas."
            required
            className="w-full resize-y rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#181700] outline-none transition-colors placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-ylw-100)]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-stone-600">Rencana intervensi</span>
          <textarea
            value={interventions}
            onChange={(e) => setInterventions(e.target.value)}
            rows={4}
            placeholder="Modalitas, terapi manual, latihan, edukasi, dan progresi."
            required
            className="w-full resize-y rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#181700] outline-none transition-colors placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-ylw-100)]"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-semibold text-stone-600">
            Interval evaluasi
            <Input
              value={reviewIntervalText}
              onChange={(e) => setReviewIntervalText(e.target.value)}
              placeholder="Contoh: setiap 2 minggu"
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-stone-600">Tanggal evaluasi</span>
            <DatePicker
              value={reviewAt}
              onChange={setReviewAt}
              disablePast
              placeholder="Pilih tanggal evaluasi"
            />
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-stone-600">Precaution / perhatian</span>
          <textarea
            value={precautions}
            onChange={(e) => setPrecautions(e.target.value)}
            rows={2}
            placeholder="Kontraindikasi atau batasan yang perlu diperhatikan."
            className="w-full resize-y rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#181700] outline-none transition-colors placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-ylw-100)]"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium text-stone-500">Status rencana</p>
            <div className="mt-1 grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1">
              {[
                { value: 'DRAFT' as const, label: 'Draft' },
                { value: 'ACTIVE' as const, label: 'Aktif' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={cn(
                    'h-8 cursor-pointer rounded-full text-xs font-semibold transition-colors',
                    status === option.value
                      ? 'bg-[#181700] font-bold text-white shadow-2xs'
                      : 'text-stone-500 hover:text-[#181700]',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-stone-500">Terlihat oleh</p>
            <div className="mt-1 grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1">
              {[
                { value: false, label: 'Internal', icon: EyeOff },
                { value: true, label: 'Pasien', icon: Eye },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setPatientVisible(option.value)}
                    className={cn(
                      'inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-full text-xs font-semibold transition-colors',
                      patientVisible === option.value
                        ? 'bg-[#181700] font-bold text-white shadow-2xs'
                        : 'text-stone-500 hover:text-[#181700]',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </GlobalSlideOver>
  );
}
