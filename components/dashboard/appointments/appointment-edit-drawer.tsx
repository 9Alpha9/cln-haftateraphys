'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { Loader2, Pencil, Save } from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { AppointmentEditForm } from '@/components/dashboard/appointment-edit-form';
import { useToast } from '@/components/ui/toast';
import { getAppointmentEditData } from '@/server/actions/appointments';
import type { AppointmentDetail } from '@/server/queries/appointments';

export type AppointmentEditData = {
  appointment: AppointmentDetail;
  therapistOptions: { id: string; label: string }[];
};

export function useAppointmentEditDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AppointmentEditData | null>(null);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);
  const { showToast } = useToast();

  function openEdit(appointmentId: string) {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setIsOpen(true);
    setIsLoading(true);
    setData(null);

    startTransition(async () => {
      try {
        const result = await getAppointmentEditData(appointmentId);
        if (requestId.current !== currentRequest) return;
        if (!result) {
          showToast('error', 'Appointment tidak ditemukan.');
          setIsOpen(false);
          return;
        }
        setData(result);
      } catch {
        if (requestId.current !== currentRequest) return;
        showToast('error', 'Data appointment tidak dapat dimuat.');
        setIsOpen(false);
      } finally {
        if (requestId.current === currentRequest) setIsLoading(false);
      }
    });
  }

  function closeEdit() {
    requestId.current += 1;
    setIsOpen(false);
    setIsLoading(false);
    setData(null);
  }

  return { isOpen, isLoading, data, openEdit, closeEdit };
}

export function AppointmentEditDrawer({
  isOpen,
  isLoading,
  data,
  onClose,
}: {
  isOpen: boolean;
  isLoading: boolean;
  data: AppointmentEditData | null;
  onClose: () => void;
}) {
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
      icon={<Pencil className="h-5 w-5" />}
      title="Edit Appointment"
      subtitle="Perbarui jadwal terapi tanpa meninggalkan halaman ini"
      footer={
        data ? (
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
              Simpan Perubahan
            </button>
          </div>
        ) : undefined
      }
    >
      {isLoading || !data ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-xs font-medium">Memuat data appointment...</p>
        </div>
      ) : (
        <AppointmentEditForm
          key={data.appointment.id}
          appointment={data.appointment}
          therapistOptions={data.therapistOptions}
          formId={formId}
          onPendingChange={setIsSaving}
          onSuccess={handleClose}
          onCancel={handleClose}
        />
      )}
    </GlobalSlideOver>
  );
}
