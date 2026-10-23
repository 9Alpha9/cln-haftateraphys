'use server';

import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';

export async function fetchAppointmentFormOptionsAction(patientId?: string) {
  try {
    const options = await getAppointmentFormOptions({ patientId });
    return { ok: true as const, ...options };
  } catch {
    return {
      ok: false as const,
      error: 'Data pasien atau terapis tidak dapat dimuat.',
      patientOptions: [],
      therapistOptions: [],
    };
  }
}
