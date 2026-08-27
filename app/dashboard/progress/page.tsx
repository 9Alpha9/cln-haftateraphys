import { Suspense } from 'react';
import Link from 'next/link';
import { Activity, Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOwnMedicalRecordSummary, getScopedTherapyProgress } from '@/server/queries/therapy-progress';
import { PatientMedicalRecordView } from '@/components/patient/patient-medical-record-view';
import { MedicalRecordFilters } from '@/components/dashboard/medical-record-filters';
import { MedicalRecordActions } from '@/components/dashboard/medical-record-actions';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

function getStatusLabel(status: 'DRAFT' | 'FINALIZED') {
  return status === 'FINALIZED' ? 'Final' : 'Draft';
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: 'DRAFT' | 'FINALIZED' | ''; visible?: string }>;
}) {
  const { role } = await requireSession({ redirectToLogin: true });
  const isPatient = role === 'USER';
  const canCreate = hasPermission(role, PERMISSIONS.PROGRESS_READ) && !isPatient;

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.q?.trim() ?? '';
  const status = params.status ?? '';
  const visible = params.visible === 'true' ? true : params.visible === 'false' ? false : '';

  const [{ items: records, totalPages, total, currentPage }, patientSummary] = await Promise.all([
    getScopedTherapyProgress({
      page,
      pageSize: isPatient ? 50 : 6,
      search,
      status,
      patientVisible: visible,
    }),
    isPatient ? getOwnMedicalRecordSummary() : Promise.resolve(null),
  ]);

  const buildUrl = (pageNumber: number) => {
    const p = new URLSearchParams();
    p.set('page', String(pageNumber));
    if (search) p.set('q', search);
    if (status) p.set('status', status);
    if (params.visible) p.set('visible', params.visible);
    return `/dashboard/progress?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardPageHeader
        title="Rekam Medis"
        description={
          isPatient
            ? 'Ringkasan evaluasi terapi yang dibagikan oleh terapis Anda.'
            : 'Kelola evaluasi klinis pasien dalam cakupan akses Anda.'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Rekam Medis' }]}
        action={
          canCreate ? (
            <Link href="/dashboard/progress/new">
              <Button size="lg">
                <Plus className="h-4 w-4" aria-hidden="true" /> Tambah Evaluasi
              </Button>
            </Link>
          ) : undefined
        }
      />

      {isPatient ? (
        <PatientMedicalRecordView patient={patientSummary} records={records} />
      ) : (
        <>
      {!isPatient && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}>
              <MedicalRecordFilters
                initialSearch={search}
                initialStatus={status}
                initialVisible={params.visible ?? ''}
              />
            </Suspense>
          </CardContent>
        </Card>
      )}

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </span>
            <h2 className="mt-4 font-semibold text-foreground">
              {isPatient ? 'Belum ada rekam medis yang dibagikan' : 'Belum ada evaluasi medis'}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {isPatient
                ? 'Evaluasi akan tampil setelah difinalisasi dan dibagikan oleh terapis.'
                : 'Belum ada data evaluasi medis yang sesuai dengan pencarian Anda.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {records.map((record) => (
              <article key={record.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-foreground text-base">{record.patientName}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {record.recordedAt.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {!isPatient ? (
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      <span className={record.status === 'FINALIZED' ? 'rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary' : 'rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground'}>
                        {getStatusLabel(record.status)}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {record.patientVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {record.patientVisible ? 'Pasien' : 'Internal'}
                      </span>
                    </div>
                  ) : null}
                </div>
                {!isPatient && record.therapistName ? (
                  <p className="mt-2 text-xs text-muted-foreground">Dicatat oleh: {record.therapistName}</p>
                ) : null}
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm border-b border-border pb-4">
                  <div><dt className="text-xs text-muted-foreground">Nyeri</dt><dd className="font-semibold text-foreground mt-0.5">{record.painScore}/10</dd></div>
                  <div><dt className="text-xs text-muted-foreground">ROM</dt><dd className="font-semibold text-foreground mt-0.5">{record.rangeOfMotionScore}/10</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Kekuatan</dt><dd className="font-semibold text-foreground mt-0.5">{record.strengthScore}/10</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Fungsi</dt><dd className="font-semibold text-foreground mt-0.5">{record.functionScore}/10</dd></div>
                </dl>
                <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-muted-foreground">
                  {record.anamnesis ? <div>
                    <strong className="text-foreground text-xs block">Anamnesis:</strong>
                    <p className="mt-1 p-2.5 text-xs text-foreground/80">{record.anamnesis}</p>
                  </div> : null}
                  {record.physicalExamination ? <div>
                    <strong className="text-foreground text-xs block">Pemeriksaan Fisik & Penunjang:</strong>
                    <p className="mt-1 p-2.5 text-xs text-foreground/80">{record.physicalExamination}</p>
                  </div> : null}
                  {record.diagnosis ? <div><strong className="text-foreground text-xs block">Diagnosis:</strong><p className="mt-1 p-2.5 text-xs text-foreground/80">{record.diagnosis}</p></div> : null}
                  {record.treatment ? <div><strong className="text-foreground text-xs block">Pengobatan & Tindakan:</strong><p className="mt-1 p-2.5 text-xs text-foreground/80">{record.treatment}</p></div> : null}
                  {record.followUpPlan ? <div><strong className="text-foreground text-xs block">Rencana Tindak Lanjut:</strong><p className="mt-1 p-2.5 text-xs text-foreground/80">{record.followUpPlan}</p></div> : null}
                  {record.summary ? <div><strong className="text-foreground text-xs block">Ringkasan Tambahan:</strong><p className="mt-1 p-2.5 text-xs text-foreground/80">{record.summary}</p></div> : null}
                </div>
                <MedicalRecordActions record={record} />
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex justify-center pt-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={currentPage > 1 ? buildUrl(currentPage - 1) : '#'}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNumber) => (
                    <PaginationItem key={pNumber}>
                      <PaginationLink href={buildUrl(pNumber)} isActive={currentPage === pNumber}>
                        {pNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href={currentPage < totalPages ? buildUrl(currentPage + 1) : '#'}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </div>
      )}
        </>
      )}
    </div>
  );
}
