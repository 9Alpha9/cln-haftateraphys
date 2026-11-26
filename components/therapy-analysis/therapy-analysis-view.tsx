import { AnatomyInteractiveStage } from './anatomy-interactive-stage';
import { LeftMetricsColumn } from './left-metrics-column';
import { RightScheduleColumn } from './right-schedule-column';
import { TopNavbar } from './top-navbar';

/**
 * Dashboard Analisis Terapi & Kesehatan — komposisi 3 kolom:
 * metrik kiri, panggung anatomi tengah, jadwal & AI kanan.
 */
export function TherapyAnalysisView({ userName }: { userName: string }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 px-4 py-4 sm:px-6 lg:py-6">
      <TopNavbar userName={userName} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_320px] lg:items-start">
        <LeftMetricsColumn />
        <AnatomyInteractiveStage />
        <RightScheduleColumn />
      </div>
    </div>
  );
}
