import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { patients, profiles } from '@/db/schema';

export async function getCurrentPatientProfile(userId: string) {
  const db = getDb();
  const [profile] = await db
    .select({
      fullName: patients.fullName,
      dateOfBirth: patients.dateOfBirth,
      occupation: patients.occupation,
      addressLine: patients.addressLine,
      emergencyContactName: patients.emergencyContactName,
      emergencyContactRelationship: patients.emergencyContactRelationship,
      emergencyContactPhone: patients.emergencyContactPhone,
      preferredName: profiles.displayName,
      phone: profiles.phone,
    })
    .from(profiles)
    .leftJoin(patients, eq(patients.userId, profiles.userId))
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile ?? null;
}
