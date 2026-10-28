'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PatientDetailDrawer } from '@/components/dashboard/patients/patient-detail-drawer';
import { PatientTableActions } from '@/components/dashboard/patient-table-actions';
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
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">No.</TableHead>
            <TableHead>Nama Pasien</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right py-2.5 pl-2 pr-1 text-xs font-semibold text-stone-500 w-12">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((patient, index) => {
            const rowIndex = index;
            const isOpen = openRowId === patient.id;

            return (
              <TableRow key={patient.id} className={isOpen ? "relative z-30" : "relative z-0"}>
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
                <TableCell className="py-3 pl-2 pr-1 text-right align-middle w-12">
                  <div className="flex items-center justify-end w-full">
                    <PatientTableActions
                      patientId={patient.id}
                      canArchive={canArchive}
                      rowIndex={rowIndex}
                      totalRows={items.length}
                      openRowId={openRowId}
                      setOpenRowId={setOpenRowId}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
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
