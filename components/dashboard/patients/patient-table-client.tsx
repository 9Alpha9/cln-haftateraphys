'use client';

import { useState } from 'react';
import { CalendarClock, Eye, Mail, Stethoscope, UserRound } from 'lucide-react';
import { PatientDetailDrawer } from '@/components/dashboard/patients/patient-detail-drawer';
import { PatientTableActions } from '@/components/dashboard/patient-table-actions';
import { cn } from '@/lib/utils';
import type { getPatientsList } from '@/server/queries/patients';

type Patient = Awaited<ReturnType<typeof getPatientsList>>['items'][number];

const STATUS_STYLES: Record<string, string> = {
  INTAKE: 'bg-[var(--hafta-ylw-50)] text-[#181700] border-[var(--hafta-ylw-200)]',
  ACTIVE: 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)] border-[var(--hafta-grn-200)]',
  ON_HOLD: 'bg-amber-50 text-amber-800 border-amber-200',
  COMPLETED: 'bg-stone-100 text-stone-600 border-stone-200',
  REFERRED: 'bg-blue-50 text-blue-700 border-blue-200',
  ARCHIVED: 'bg-stone-100 text-stone-500 border-stone-200',
};

const STATUS_LABELS: Record<string, string> = {
  INTAKE: 'Intake',
  ACTIVE: 'Aktif',
  ON_HOLD: 'Ditunda',
  COMPLETED: 'Selesai',
  REFERRED: 'Rujuk',
  ARCHIVED: 'Diarsipkan',
};

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Laki-laki',
  FEMALE: 'Perempuan',
  OTHER: 'Lainnya',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getAge(dateOfBirth: Date | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function PatientAvatar({ patient }: { patient: Patient }) {
  if (patient.avatarKey) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={patient.avatarKey}
        alt={patient.fullName}
        className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-stone-200"
      />
    );
  }
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--hafta-ylw-50)] text-xs font-bold text-[#181700] shadow-2xs">
      {getInitials(patient.fullName)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold',
        STATUS_STYLES[status] ?? STATUS_STYLES.INTAKE,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PatientTableClient({
  items,
  currentPage,
  pageSize = 4,
  canArchive,
}: {
  items: Patient[];
  currentPage: number;
  pageSize?: number;
  canArchive: boolean;
}) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {items.map((patient, index) => {
          const age = getAge(patient.dateOfBirth);
          const nextSession = formatDate(patient.nextTherapyAt);
          const metaLine = [
            age !== null ? `${age} tahun` : null,
            patient.gender ? GENDER_LABELS[patient.gender] : null,
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <li
              key={patient.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(24,23,0,0.09)] sm:p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <PatientAvatar patient={patient} />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[#181700] sm:text-base">
                        {patient.fullName}
                      </h3>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-stone-400">
                        {patient.medicalRecordNumber
                          ? `No. RM ${patient.medicalRecordNumber}`
                          : `Pasien #${(currentPage - 1) * pageSize + index + 1}`}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={patient.caseStatus} />
                </div>

                <div className="mt-3 space-y-2 rounded-2xl bg-[#FBFBFA] p-3 text-xs text-stone-600">
                  <div className="flex min-w-0 items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span className="truncate">
                      {patient.therapistName ?? 'Belum ada terapis'}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span className="truncate">
                      {nextSession ? `Sesi berikutnya ${nextSession}` : 'Belum ada jadwal sesi'}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                  {metaLine ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <UserRound className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                      <span className="truncate">{metaLine}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setDrawerOpen(true);
                  }}
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-200)] whitespace-nowrap"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Lihat Detail
                </button>

                <PatientTableActions
                  patientId={patient.id}
                  canArchive={canArchive}
                  rowIndex={index}
                  totalRows={items.length}
                  openRowId={openRowId}
                  setOpenRowId={setOpenRowId}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {selectedPatientId && (
        <PatientDetailDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          patientId={selectedPatientId}
        />
      )}
    </>
  );
}
