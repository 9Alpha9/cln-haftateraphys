'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Trash2,
  Printer,
  MoreVertical,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { hasPermission } from '@/lib/permissions/policy';
import { PERMISSIONS } from '@/lib/permissions/constants';
import type { Role } from '@/lib/permissions/roles';
import { deleteAppointment } from '@/server/actions/appointments';
import { markCalendarAppointmentsRead } from '@/server/actions/appointment-notifications';
import { cn } from '@/lib/utils';
import type { AppointmentView } from '@/server/queries/appointments';
import { AppointmentEditButton } from '@/components/dashboard/appointments/appointment-edit-button';
import { CompleteSessionButton } from '@/components/dashboard/appointments/complete-session-button';

function FloatingActionMenu({ items, onClose, buttonRef }: { items: { label: string; onClick: () => void }[]; onClose: () => void; buttonRef: React.RefObject<HTMLButtonElement | null> }) {
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buttonRef.current || !actionMenuRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menu = actionMenuRef.current;
    menu.style.top = `${rect.top - 8}px`;
    menu.style.left = `${rect.right - 192}px`;
    return () => {
      menu.style.top = '';
      menu.style.left = '';
    };
  }, [buttonRef, actionMenuRef]);

  return createPortal(
    <div ref={actionMenuRef} className="fixed z-[60] rounded-2xl bg-white border border-stone-200/90 shadow-xl p-1.5 min-w-[160px] animate-in slide-in-from-right-2 fade-in duration-200">
      {items.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#181700] hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap"
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

const statusConfig: Record<
  string,
  { label: string; dotColor: string; textColor: string; bgColor: string; border: string }
> = {
  SCHEDULED: {
    label: 'Terjadwal',
    dotColor: 'bg-[#e3db00]',
    textColor: 'text-[#181700]',
    bgColor: 'bg-[var(--hafta-ylw-50)]/70',
    border: 'border-[var(--hafta-ylw-200)]/70',
  },
  IN_PROGRESS: {
    label: 'Sedang Berjalan',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-900',
    bgColor: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  COMPLETED: {
    label: 'Selesai',
    dotColor: 'bg-stone-500',
    textColor: 'text-stone-700',
    bgColor: 'bg-stone-100',
    border: 'border-stone-200',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    dotColor: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    border: 'border-red-200',
  },
  RESCHEDULED: {
    label: 'Dijadwal Ulang',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-800',
    bgColor: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

const typeLabel: Record<string, string> = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Sesi Lanjutan',
  EVALUATION: 'Evaluasi Klinis',
  DISCHARGE: 'Pemeriksaan Akhir',
  CONSULTATION: 'Konsultasi',
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
  const router = useRouter();
  const { showToast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const canEdit = hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE);
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

  useEffect(() => {
    if (!showActionMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowActionMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

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
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--hafta-ylw-200)] hover:shadow-md">
        <div>
          {/* Header Baris Atas: Pasien & Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-ylw-50)] text-[#181700]">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-[#181700] sm:text-base">
                    {appointment.patientName}
                  </h3>
                  {appointment.isNew && (
                    <span className="rounded-full bg-[var(--hafta-ylw-100)] px-2 py-0.5 font-mono text-[9px] font-black text-[#181700]">
                      BARU
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-stone-500">
                  {typeLabel[appointment.type] ?? appointment.type}
                </p>
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
          <div className="mt-4 space-y-2 rounded-xl border border-stone-100 bg-[#FEFEF6] p-3.5 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="font-semibold text-stone-800">{formattedDay}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span>
                {appointment.startTime} – {calculateEndTime(appointment.startTime, appointment.durationMinutes)} ({appointment.durationMinutes} mnt)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">Terapis: {appointment.therapistName || 'Belum ditentukan'}</span>
            </div>
          </div>
        </div>

        {/* Baris Tombol Aksi — 2 Baris Terstruktur, 0% Terpotong */}
        <div className="mt-4 flex flex-col gap-2.5 border-t border-stone-100 pt-4">
          {/* Desktop/Tablet (≥640px): Baris 1 - Tombol Utama penuh lebar, Baris 2 - Grid 3 kolom */}
          <div className="hidden sm:flex sm:flex-col gap-2.5">
            {canComplete ? (
              <CompleteSessionButton
                appointmentId={appointment.id}
                className="w-full h-10 px-4 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap"
              />
            ) : null}
            <div className="grid grid-cols-3 gap-2 w-full">
              {canEdit && (
                <AppointmentEditButton
                  appointmentId={appointment.id}
                  className="h-10 px-2 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                />
              )}
              <Link
                href={`/dashboard/appointments/${appointment.id}/print`}
                target="_blank"
                className="h-10 px-2 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak</span>
              </Link>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-10 px-2 rounded-full bg-[var(--hafta-red-50)] hover:bg-[var(--hafta-red-100)] text-[var(--hafta-red-600)] border border-[var(--hafta-red-200)] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile (<640px): 1 Baris Kompak - Tombol Utama (Selesaikan) + Action Dot 3 (⋮) */}
          <div className="sm:hidden flex items-center gap-2 w-full">
            {canComplete ? (
              <CompleteSessionButton
                appointmentId={appointment.id}
                className="flex-1 h-10 rounded-full font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700]"
              />
            ) : null}
            <button
              type="button"
              ref={moreButtonRef}
              className="shrink-0 w-10 h-10 aspect-square rounded-full bg-white hover:bg-stone-100 border border-stone-200/90 text-[#181700] flex items-center justify-center cursor-pointer"
              onClick={() => setShowActionMenu(true)}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showActionMenu && (
        <FloatingActionMenu
          buttonRef={moreButtonRef}
          items={[
            canEdit
              ? {
                  label: 'Edit',
                  onClick: () => {},
                }
              : null,
            {
              label: 'Cetak',
              onClick: () => window.open(`/dashboard/appointments/${appointment.id}/print`, '_blank'),
            },
            canEdit
              ? {
                  label: 'Hapus',
                  onClick: () => setShowDeleteDialog(true),
                }
              : null,
          ].filter(Boolean) as { label: string; onClick: () => void }[]}
          onClose={() => setShowActionMenu(false)}
        />
      )}

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
    </>
  );
}
