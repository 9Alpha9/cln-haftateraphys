'use client';

import { useState } from 'react';
import { AppointmentFormDrawer } from '@/components/dashboard/appointments/appointment-form-drawer';
import { fetchAppointmentFormOptionsAction } from '@/server/actions/appointment-form-options';

type SelectOption = { id: string; label: string };

type Props = {
  children: React.ReactNode;
  className?: string;
  patientOptions?: SelectOption[];
  therapistOptions?: SelectOption[];
  defaultPatientId?: string;
  defaultDate?: string;
  defaultTime?: string;
};

export function NewAppointmentButton({
  children,
  className,
  patientOptions: initialPatientOptions,
  therapistOptions: initialTherapistOptions,
  defaultPatientId,
  defaultDate,
  defaultTime,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patientOptions, setPatientOptions] = useState<SelectOption[]>(initialPatientOptions ?? []);
  const [therapistOptions, setTherapistOptions] = useState<SelectOption[]>(initialTherapistOptions ?? []);

  async function openDrawer() {
    setIsOpen(true);
    if (initialPatientOptions && initialTherapistOptions) return;

    setLoading(true);
    const result = await fetchAppointmentFormOptionsAction(defaultPatientId);
    setLoading(false);

    if (result.ok) {
      setPatientOptions(result.patientOptions);
      setTherapistOptions(result.therapistOptions);
    } else {
      setPatientOptions(result.patientOptions);
      setTherapistOptions(result.therapistOptions);
    }
  }

  return (
    <>
      <button type="button" onClick={openDrawer} className={className}>
        {children}
      </button>
      <AppointmentFormDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        patientOptions={patientOptions}
        therapistOptions={therapistOptions}
        defaultPatientId={defaultPatientId}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
        loading={loading}
      />
    </>
  );
}
