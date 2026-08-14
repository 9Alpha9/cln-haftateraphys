import { z } from 'zod';

export const intakeReviewSchema = z
  .object({
    patientId: z.string().uuid(),
    action: z.enum(['start-review', 'request-revision', 'accept']),
    reviewMessage: z.string().trim().max(1000).optional().or(z.literal('')),
  })
  .superRefine((value, context) => {
    if (value.action === 'request-revision' && (value.reviewMessage?.trim().length ?? 0) < 5) {
      context.addIssue({
        code: 'custom',
        path: ['reviewMessage'],
        message: 'Pesan perbaikan untuk pasien minimal 5 karakter.',
      });
    }
  });

export type IntakeReviewInput = z.infer<typeof intakeReviewSchema>;
