import { z } from 'zod';

export const completeSessionSchema = z.object({
  appointmentId: z.string().uuid(),
  note: z.string().trim().max(1000).optional(),
});

export const completeProgramSchema = z.object({
  patientId: z.string().uuid(),
  summary: z
    .string()
    .trim()
    .min(10, 'Ringkasan penutupan terapi minimal 10 karakter.')
    .max(2000, 'Ringkasan penutupan terapi maksimal 2000 karakter.'),
});
