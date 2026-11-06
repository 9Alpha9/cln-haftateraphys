import { z } from 'zod';

export const staffProfileSchema = z.object({
  name: z.string().trim().min(2, 'Nama lengkap wajib diisi.').max(200),
  displayName: z.string().trim().max(120).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  avatarKey: z.string().trim().optional().or(z.literal('')),
});

export type StaffProfileInput = z.infer<typeof staffProfileSchema>;
