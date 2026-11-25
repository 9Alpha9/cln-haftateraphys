'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MapPin,
  Trash2,
  MoreVertical,
  Printer,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { hasPermission } from '@/lib/permissions/policy';
import { PERMISSIONS } from '@/lib/permissions/constants';
import type { Role } from '@/lib/permissions/roles';
import { deleteAppointment } from '@/server/actions/appointments';
import { markCalendarAppointmentsRead } from '@/server/actions/appointment-notifications';
import { cn } from '@/lib/utils';
import { AppointmentPrintDialog } from '@/components/pdf/appointment-print-dialog';
import type { AppointmentView } from '@/server/queries/appointments';
import { AppointmentEditButton } from '@/components/dashboard/appointments/appointment-edit-button';
import { AppointmentEditDrawer, useAppointmentEditDrawer } from '@/components/dashboard/appointments/appointment-edit-drawer';
import { CompleteSessionButton } from '@/components/dashboard/appointments/complete-session-button';

const statusConfig: Record<
  string,
  { label: string; dotColor: string; textColor: string; bgColor: string; border: string }
> = {
  SCHEDULED: {
    label: 'Terjadwal',
    dotColor: 'bg-[#e3db00]',
    textColor: 'text-foreground',
    bgColor: 'bg-[var(--hafta-org-50)]/70',
    border: 'border-[var(--hafta-org-200)]/70',
  },
  IN_PROGRESS: {
    label: 'Sedang berjalan',
    dotColor: 'bg-hafta-grn-500',
    textColor: 'text-hafta-grn-800',
    bgColor: 'bg-hafta-grn-50',
    border: 'border-hafta-grn-200',
  },
  COMPLETED: {
    label: 'Selesai',
    dotColor: 'bg-muted-foreground',
    textColor: 'text-muted-foreground',
    bgColor: 'bg-muted',
    border: 'border-border',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    dotColor: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    border: 'border-red-200',
  },
  RESCHEDULED: {
    label: 'Dijadwalkan ulang',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-800',
    bgColor: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

export function AppointmentCard({
  appointment,
  role,
}: {
  appointment: AppointmentView;
  role: Role;
}) {
  const { showToast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const editor = useAppointmentEditDrawer();

  const canEdit = hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE);
  const isLocked =
    appointment.status === 'COMPLETED' ||
    appointment.status === 'CANCELLED' ||
    appointment.status === 'NO_SHOW';
  const canModify = canEdit && !isLocked;
  const canComplete =
    hasPermission(role, PERMISSIONS.APPOINTMENT_COMPLETE) &&
    (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED');

  const date = new Date(appointment.scheduledDate);
  const formattedDay = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  const status = statusConfig[appointment.status] ?? statusConfig.SCHEDULED;

  useEffect(() => {
    if (!appointment.isNew) return;
    const timeoutId = window.setTimeout(() => {
      markCalendarAppointmentsRead([appointment.id]).catch(() => {});
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [appointment.id, appointment.isNew]);

  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAppointment(appointment.id);
      showToast('success', 'Jadwal terapi berhasil dihapus.');
      router.refresh();
    } catch {
      showToast('error', 'Gagal menghapus jadwal. Silakan coba lagi.');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <>
      <div className="group relative flex flex-col justify-between hafta-card p-4 transition-all duration-200 hover:-translate-y-0.5 sm:p-5">
        <div>
          {/* Header Baris Atas: Pasien & Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {appointment.patientImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={appointment.patientImage}
                  alt={appointment.patientName}
                  className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-border"
                />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-xs font-bold text-foreground">
                  {appointment.patientName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-foreground sm:text-base">
                    {appointment.patientName}
                  </h3>
                  {appointment.isNew && (
                    <span className="rounded-full bg-[var(--hafta-org-100)] px-2 py-0.5 font-mono text-[9px] font-black text-foreground">
                      BARU
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold',
                status.bgColor,
                status.textColor,
                status.border
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dotColor)} />
              {status.label}
            </span>
          </div>

          {/* Blok Info Jadwal */}
          <div className="mt-3 space-y-2 rounded-2xl bg-[var(--hafta-50)] p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground">{formattedDay}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>
                {appointment.startTime} – {calculateEndTime(appointment.startTime, appointment.durationMinutes)} WIB ({appointment.durationMinutes} mnt)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">Terapis: {appointment.therapistName || 'Belum ditentukan'}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {canComplete ? (
            <CompleteSessionButton
              appointmentId={appointment.id}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)]"
            />
          ) : canModify ? (
            <AppointmentEditButton
              appointmentId={appointment.id}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)]"
              label="Ubah Jadwal"
            />
          ) : (
            <span />
          )}

          <div className="flex shrink-0 items-center gap-2">
            {canComplete && canModify && (
              <AppointmentEditButton
                appointmentId={appointment.id}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                label="Edit"
              />
            )}
            <AppointmentDropdown
              appointment={appointment}
              onDelete={() => setShowDeleteDialog(true)}
              onPrint={() => setPrintOpen(true)}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Hapus Jadwal Terapi?"
        description={`Anda yakin ingin menghapus jadwal untuk ${appointment.patientName}? Tindakan ini akan membatalkan sesi.`}
        confirmLabel="Ya, Hapus"
        variant="destructive"
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
      <AppointmentEditDrawer
        isOpen={editor.isOpen}
        isLoading={editor.isLoading}
        data={editor.data}
        onClose={editor.closeEdit}
      />
      <AppointmentPrintDialog
        appointmentId={appointment.id}
        patientName={appointment.patientName}
        open={printOpen}
        onOpenChange={setPrintOpen}
      />
    </>
  );
}

function AppointmentDropdown({
  appointment,
  onDelete,
  onPrint,
}: {
  appointment: AppointmentView;
  onDelete: () => void;
  onPrint?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Aksi jadwal"
        className="inline-flex h-11 w-11 aspect-square shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
      >
        <MoreVertical className="h-4 w-4 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-48">
        <DropdownMenuItem
          onClick={() => onPrint?.()}
          className="min-h-[44px] gap-2.5 text-xs text-muted-foreground"
        >
          <Printer className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">Cetak Jadwal</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="min-h-[44px] gap-2.5 text-xs text-muted-foreground"
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-[var(--hafta-red-600)]">Hapus Jadwal</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
