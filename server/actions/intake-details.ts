'use server';

import { getScopedIntakeForReview } from '@/server/queries/intake-review';

export async function fetchIntakeDetailAction(patientId: string) {
  try {
    const intake = await getScopedIntakeForReview(patientId);
    return { success: true, data: intake };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Akses ditolak atau form tidak ditemukan' };
  }
}
