ALTER TABLE "patient_intakes" ADD COLUMN IF NOT EXISTS "privacy_consent" integer DEFAULT 0 NOT NULL;
ALTER TABLE "patient_intakes" ADD COLUMN IF NOT EXISTS "privacy_consent_at" timestamp with time zone;
ALTER TABLE "patient_intakes" ADD COLUMN IF NOT EXISTS "media_consent" integer DEFAULT 0 NOT NULL;
