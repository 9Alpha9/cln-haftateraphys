'use client';

import { useState } from 'react';
import { AppointmentFormDrawer } from '@/components/dashboard/appointments/appointment-form-drawer';
import { fetchAppointmentFormOptionsAction } from '@/server/actions/appointment-form-options';
import { Button } from '@/components/ui/button';

type SelectOption = { id: string; label: string };

type Props = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  patientOptions?: SelectOption[];
  therapistOptions?: SelectOption[];
  defaultPatientId?: string;
  defaultDate?: string;
  defaultTime?: string;
};

export function NewAppointmentButton({
  children,
  className,
  variant = 'default',
  size = 'default',
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
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={openDrawer}
        className={className}
      >
        <span className="inline-flex items-center gap-2">{children}</span>
      </Button>
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
