import { z } from 'zod';

const optionalText = z.string().trim().max(500).optional().or(z.literal(''));

export const therapyScheduleSchema = z.object({
  nextTherapyAt: z.string().optional().or(z.literal('')),
  therapyFrequencyText: optionalText,
  therapyGoal: optionalText,
  therapistNote: optionalText,
});

export type TherapyScheduleInput = z.infer<typeof therapyScheduleSchema>;
