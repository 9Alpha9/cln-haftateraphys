'use client';

import { useId, useState } from 'react';
import { CalendarPlus, Loader2, Save } from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { SkeletonBlock, SkeletonLine } from '@/components/dashboard/skeletons/skeleton-primitives';
import { AppointmentCreateForm } from '@/components/dashboard/appointment-create-form';

type SelectOption = { id: string; label: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  patientOptions: SelectOption[];
  therapistOptions: SelectOption[];
  defaultPatientId?: string;
  defaultDate?: string;
  defaultTime?: string;
  loading?: boolean;
};

export function AppointmentFormDrawer({
  isOpen,
  onClose,
  patientOptions,
  therapistOptions,
  defaultPatientId,
  defaultDate,
  defaultTime,
  loading = false,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const formId = useId();

  function handleClose() {
    setIsSaving(false);
    onClose();
  }

  return (
    <GlobalSlideOver
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      icon={<CalendarPlus className="h-5 w-5" />}
      title="Buat Appointment"
      subtitle="Tambahkan jadwal sesi terapi tanpa meninggalkan halaman ini"
      footer={
        loading ? undefined : (
          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              form={formId}
              disabled={isSaving}
              className="h-11 px-4 sm:px-5 rounded-full bg-[var(--hafta-300)] hover:bg-[var(--hafta-400)] text-foreground font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Jadwal
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="h-11 px-4 sm:px-5 rounded-full bg-card hover:bg-accent text-foreground border border-border font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
            >
              Batal
            </button>
          </div>
        )
      }
    >
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Memuat data appointment">
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <SkeletonLine className="w-24 bg-muted" />
                <SkeletonBlock className="h-10 w-full rounded-xl bg-muted" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <SkeletonLine className="w-24 bg-muted" />
            <SkeletonBlock className="h-24 w-full rounded-xl bg-muted" />
          </div>
          <div className="flex justify-end gap-2">
            <SkeletonBlock className="h-10 w-28 rounded-full bg-muted" />
            <SkeletonBlock className="h-10 w-28 rounded-full bg-muted" />
          </div>
        </div>
      ) : (
        isOpen && (
          <AppointmentCreateForm
            key={`${defaultPatientId ?? 'all'}-${defaultDate ?? ''}-${defaultTime ?? ''}`}
            patientOptions={patientOptions}
            therapistOptions={therapistOptions}
            defaultPatientId={defaultPatientId}
            defaultDate={defaultDate}
            defaultTime={defaultTime}
            formId={formId}
            onPendingChange={setIsSaving}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        )
      )}
    </GlobalSlideOver>
  );
}
