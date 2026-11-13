'use client';

/**
 * Backward-compatible alias.
 *
 * The dashboard shell was consolidated into `PatientDashboardShell` so every
 * role (patient, therapist, admin, super admin) uses one navigation renderer.
 * Keep this re-export for older imports instead of duplicating the shell.
 */
export { PatientDashboardShell as AdminDashboardShell } from '@/components/patient/patient-dashboard-shell';
