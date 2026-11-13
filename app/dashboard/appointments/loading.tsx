import { RouteSkeleton } from '@/components/dashboard/skeletons/route-skeletons';

/**
 * Render the skeleton synchronously so it appears the moment navigation
 * starts. Choosing the variant with CSS (based on the shell's `data-role`)
 * avoids an auth round-trip that previously delayed the skeleton.
 */
export default function AppointmentsLoading() {
  return (
    <>
      <div className="skeleton-patient-only">
        <RouteSkeleton variant="patient-appointments" />
      </div>
      <div className="skeleton-staff-only">
        <RouteSkeleton variant="appointments" />
      </div>
    </>
  );
}
