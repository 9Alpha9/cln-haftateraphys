'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PatientDetailDrawer } from '@/components/dashboard/patients/patient-detail-drawer';
import { PatientTableActions } from '@/components/dashboard/patient-table-actions';
import { cn } from '@/lib/utils';
import type { getPatientsList } from '@/server/queries/patients';

type Patient = Awaited<ReturnType<typeof getPatientsList>>['items'][number];

export function PatientTableClient({
  items,
  currentPage,
  canArchive,
}: {
  items: Patient[];
  currentPage: number;
  canArchive: boolean;
}) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">No.</TableHead>
            <TableHead>Nama Pasien</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Terdaftar</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((patient, index) => (
            <TableRow key={patient.id}>
              <TableCell className="text-muted-foreground">
                {(currentPage - 1) * 10 + index + 1}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => setSelectedPatientId(patient.id)}
                  className="font-semibold text-foreground hover:text-[var(--hafta-ylw-950)] hover:underline"
                >
                  {patient.fullName}
                </button>
              </TableCell>
              <TableCell>
                <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-[#92400e]">
                  {patient.caseStatus}
                </span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {patient.createdAt.toLocaleDateString('id-ID')}
              </TableCell>
              <TableCell>
                <PatientTableActions patientId={patient.id} canArchive={canArchive} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedPatientId && (
        <PatientDetailDrawer
          isOpen={!!selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
          patientId={selectedPatientId}
        />
      )}
    </>
  );
}
