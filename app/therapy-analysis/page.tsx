import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { TherapyAnalysisView } from '@/components/therapy-analysis/therapy-analysis-view';

export const metadata: Metadata = {
  title: 'Analisis Terapi & Kesehatan — Hafta Fisioterapi',
};

/**
 * Dashboard Analisis Terapi & Kesehatan — halaman mandiri (di luar shell
 * /dashboard) dengan navbar atasnya sendiri. Gating mengikuti aturan membaca
 * rekam medis: pasien PROGRESS_READ_OWN, staf PROGRESS_READ.
 */
export default async function TherapyAnalysisPage() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  const isPatient = role === 'USER';
  const canRead = hasPermission(role, isPatient ? PERMISSIONS.PROGRESS_READ_OWN : PERMISSIONS.PROGRESS_READ);
  if (!canRead) {
    redirect('/dashboard');
  }

  return <TherapyAnalysisView userName={session.user.name ?? 'Pasien'} />;
}
