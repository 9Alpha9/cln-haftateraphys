import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function minutes(value: string) {
  const [hours, mins] = value.split(':').map(Number);
  return hours * 60 + mins;
}

export const therapistScheduleEntrySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timePattern, 'Format jam tidak valid.'),
    endTime: z.string().regex(timePattern, 'Format jam tidak valid.'),
  })
  .refine((entry) => minutes(entry.endTime) > minutes(entry.startTime), {
    message: 'Jam selesai harus lebih lambat dari jam mulai.',
    path: ['endTime'],
  });

export const saveTherapistScheduleSchema = z
  .object({
    therapistId: z.string().uuid(),
    entries: z.array(therapistScheduleEntrySchema).max(50),
  })
  .superRefine((value, ctx) => {
    const byDay = new Map<number, Array<{ start: number; end: number; index: number }>>();
    value.entries.forEach((entry, index) => {
      const items = byDay.get(entry.dayOfWeek) ?? [];
      items.push({ start: minutes(entry.startTime), end: minutes(entry.endTime), index });
      byDay.set(entry.dayOfWeek, items);
    });

    for (const items of byDay.values()) {
      const sorted = [...items].sort((a, b) => a.start - b.start);
      for (let index = 1; index < sorted.length; index += 1) {
        if (sorted[index].start < sorted[index - 1].end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Jadwal pada hari yang sama tidak boleh saling bertumpuk.',
            path: ['entries', sorted[index].index],
          });
        }
      }
    }
  });

export const therapistTimeOffSchema = z
  .object({
    therapistId: z.string().uuid(),
    startDate: z.string().regex(datePattern, 'Tanggal mulai tidak valid.'),
    endDate: z.string().regex(datePattern, 'Tanggal selesai tidak valid.'),
    reason: z.string().trim().max(300).optional().or(z.literal('')),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
    path: ['endDate'],
  });

export type TherapistScheduleEntryInput = z.infer<typeof therapistScheduleEntrySchema>;
export type TherapistTimeOffInput = z.infer<typeof therapistTimeOffSchema>;
