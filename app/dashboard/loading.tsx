import { RouteSkeleton } from '@/components/dashboard/skeletons/route-skeletons';

/**
 * Role-aware dashboard skeleton. Rendered synchronously so it appears as soon
 * as navigation starts; the visible variant is selected by the shell's
 * `data-role` attribute through CSS (see globals.css).
 */
export default function DashboardLoading() {
  return (
    <>
      <div className="skeleton-patient-only">
        <RouteSkeleton variant="patient-dashboard" />
      </div>
      <div className="skeleton-staff-only">
        <RouteSkeleton variant="staff-dashboard" />
      </div>
    </>
  );
}
