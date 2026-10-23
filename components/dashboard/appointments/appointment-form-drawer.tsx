'use client';

import { useId, useState } from 'react';
import { CalendarPlus, Loader2, Save } from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="h-10 cursor-pointer rounded-full border border-stone-200 bg-white px-5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              form={formId}
              disabled={isSaving}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Jadwal
            </button>
          </div>
        )
      }
    >
      {loading ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-xs font-medium">Memuat data pasien dan terapis...</p>
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
