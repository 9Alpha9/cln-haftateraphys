import { z } from 'zod';

const optionalText = z.string().trim().max(500).optional().or(z.literal(''));

export const patientProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Nama lengkap wajib diisi.').max(200),
  preferredName: optionalText,
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  medicalRecordNumber: optionalText,
  dateOfBirth: z.string().date().optional().or(z.literal('')),
  occupation: optionalText,
  addressLine: z.string().trim().max(1000).optional().or(z.literal('')),
  addressProvince: optionalText,
  addressCity: optionalText,
  emergencyContactName: optionalText,
  emergencyContactRelationship: optionalText,
  emergencyContactPhone: z.string().trim().max(30).optional().or(z.literal('')),
  avatarKey: z.string().trim().optional().or(z.literal('')),
});

export type PatientProfileInput = z.infer<typeof patientProfileSchema>;
