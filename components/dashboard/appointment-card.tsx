"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, User, Calendar, Pencil, Trash2, Printer, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { markCalendarAppointmentsRead } from "@/server/actions/appointment-notifications";
import { deleteAppointment } from "@/server/actions/appointments";
import type { AppointmentView } from "@/server/queries/appointments";

const typeLabel: Record<string, string> = {
  INITIAL_ASSESSMENT: "Assessment Awal",
  THERAPY_SESSION: "Sesi Terapi",
  FOLLOW_UP: "Tindak Lanjut",
  EVALUATION: "Evaluasi",
};

const statusConfig: Record<string, { label: string; dotColor: string; textColor: string; bgColor: string }> = {
  SCHEDULED: {
    label: "Terjadwal",
    dotColor: "bg-emerald-500",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  CONFIRMED: {
    label: "Terkonfirmasi",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
  IN_PROGRESS: {
    label: "Sedang Berlangsung",
    dotColor: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  COMPLETED: {
    label: "Selesai",
    dotColor: "bg-emerald-600",
    textColor: "text-emerald-800",
    bgColor: "bg-emerald-100",
  },
  CANCELLED: {
    label: "Dibatalkan",
    dotColor: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
  },
  RESCHEDULED: {
    label: "Dijadwalkan Ulang",
    dotColor: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
  },
  NO_SHOW: {
    label: "Tidak Hadir",
    dotColor: "bg-red-600",
    textColor: "text-red-800",
    bgColor: "bg-red-100",
  },
};

export function AppointmentCard({
  appointment,
  role,
}: {
  appointment: AppointmentView;
  role: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const canEdit = ["SUPER_ADMIN", "ADMIN", "THERAPIST", "STAFF"].includes(role);

  const date = new Date(appointment.scheduledDate);
  const formattedDate = date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const longDate = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const status = statusConfig[appointment.status as keyof typeof statusConfig] ?? {
    label: appointment.status,
    dotColor: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
  };

  useEffect(() => {
    if (!appointment.isNew) return;
    const timeoutId = window.setTimeout(() => {
      markCalendarAppointmentsRead([appointment.id]).catch(() => {});
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [appointment.id, appointment.isNew]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAppointment(appointment.id);
      showToast("success", "Jadwal terapi berhasil dihapus.");
      router.refresh();
    } catch {
      showToast("error", "Gagal menghapus jadwal. Silakan coba lagi.");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <>
      <Card className="group overflow-hidden border-gray-100 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Patient icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/50">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-gray-900">
                    {appointment.patientName}
                  </h3>
                  {appointment.isNew && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 3 }}
                      className="shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                    >
                      BARU
                    </motion.span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {typeLabel[appointment.type as keyof typeof typeLabel] ?? appointment.type}
                </p>
              </div>
            </div>
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.bgColor} ${status.textColor}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
              {status.label}
            </span>
          </div>

          {/* Info section */}
          <div className="mx-4 mb-4 space-y-2.5 rounded-xl bg-gray-50/80 px-4 py-3 sm:mx-5 sm:mb-5">
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>
                {appointment.startTime} – {calculateEndTime(appointment.startTime, appointment.durationMinutes)} · {appointment.durationMinutes} menit
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-amber-500" />
              <span className="truncate">
                Terapis: {appointment.therapistName ?? "Belum ditentukan"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
            {canEdit && (
              <>
                <Link href={`/dashboard/appointments/${appointment.id}/edit`} className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto border-gray-200 hover:bg-gray-50">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex-1 sm:flex-none shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </Button>
              </>
            )}
            <div className="ml-auto">
              <Link href={`/dashboard/appointments/${appointment.id}/print`}>
                <Button
                  size="sm"
                  className="shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" /> Cetak
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Hapus Appointment"
        description={`Yakin ingin menghapus jadwal terapi ${appointment.patientName} pada ${longDate}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={deleting ? "Menghapus..." : "Hapus"}
        cancelLabel="Batal"
        variant="destructive"
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}
