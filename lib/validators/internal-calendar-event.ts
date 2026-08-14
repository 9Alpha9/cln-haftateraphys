import { z } from 'zod';

const eventTypes = ['CLINIC_CLOSURE', 'TRAINING', 'INTERNAL_EVENT', 'IMPORTANT_NOTICE'] as const;

export const internalCalendarEventSchema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter.').max(200),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  eventType: z.enum(eventTypes),
  scheduledDate: z.string().date(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .or(z.literal('')),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .or(z.literal('')),
  patientVisible: z.boolean(),
});

export type InternalCalendarEventInput = z.infer<typeof internalCalendarEventSchema>;
