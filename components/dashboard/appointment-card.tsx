"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Clock3, UserRound, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentPrintLink } from "@/components/dashboard/appointment-print-link";
import { markCalendarAppointmentsRead } from "@/server/actions/appointment-notifications";
import type { AppointmentView } from "@/server/queries/appointments";

const typeLabel = {
  INITIAL_ASSESSMENT: "Assessment Awal",
  THERAPY_SESSION: "Sesi Terapi",
  FOLLOW_UP: "Tindak Lanjut",
  EVALUATION: "Evaluasi"
} as const;

const statusLabel = {
  SCHEDULED: "Terjadwal",
  CONFIRMED: "Terkonfirmasi",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  RESCHEDULED: "Dijadwalkan Ulang",
  NO_SHOW: "Tidak Hadir"
} as const;

export function AppointmentCard({
  appointment,
  role,
}: {
  appointment: AppointmentView;
  role: string;
}) {
  const date = new Date(appointment.scheduledDate).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  useEffect(() => {
    if (!appointment.isNew) return;
    const timeoutId = window.setTimeout(() => {
      markCalendarAppointmentsRead([appointment.id]).catch(() => {});
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [appointment.id, appointment.isNew]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {appointment.patientName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {typeLabel[appointment.type as keyof typeof typeLabel]}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {statusLabel[appointment.status as keyof typeof statusLabel]}
            </span>
            {appointment.isNew && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 3 }}
                className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground"
              >
                BARU
              </motion.span>
            )}
          </div>
        </div>
        <div className="grid gap-2 rounded-lg bg-surface p-3 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-primary" /> <span>{date}</span>
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock3 className="h-4 w-4 text-primary" />{" "}
            <span>{appointment.startTime} · {appointment.durationMinutes} menit</span>
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <UserRound className="h-4 w-4 text-primary" />{" "}
            <span>
              Terapis: {appointment.therapistName ?? "Belum ditentukan"}
            </span>
          </p>
        </div>
        <div className="flex justify-end border-t border-border pt-4">
          <AppointmentPrintLink appointmentId={appointment.id} />
        </div>
      </CardContent>
    </Card>
  );
}
