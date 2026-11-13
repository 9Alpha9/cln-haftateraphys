import { Dumbbell } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PatientExerciseList } from '@/components/patient/patient-exercise-list';
import { getOwnHomeProgram } from '@/server/queries/home-programs';

export const dynamic = 'force-dynamic';

export default async function ExercisesPage() {
  const program = await getOwnHomeProgram();

  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <DashboardPageHeader
        title="Latihan Saya"
        description="Program latihan mandiri aktif yang dibagikan fisioterapis Anda."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Latihan Saya' }]}
        icon={<Dumbbell className="h-6 w-6" />}
      />
      <PatientExerciseList program={program} />
    </div>
  );
}
