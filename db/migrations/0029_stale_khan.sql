CREATE TYPE "public"."consent_source" AS ENUM('INTAKE', 'PATIENT_PORTAL', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('PENDING', 'GRANTED', 'WITHDRAWN', 'EXPIRED', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('PRIVACY_DATA_PROCESSING', 'CLINICAL_SERVICE', 'DOCUMENT_UPLOAD', 'MEDIA_PUBLICATION', 'TESTIMONIAL_PUBLICATION');--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"type" "consent_type" NOT NULL,
	"policy_version" text NOT NULL,
	"status" "consent_status" DEFAULT 'PENDING' NOT NULL,
	"granted_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"source" "consent_source" DEFAULT 'PATIENT_PORTAL' NOT NULL,
	"captured_by" uuid,
	"metadata_safe" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_captured_by_users_id_fk" FOREIGN KEY ("captured_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consents_patient_id_idx" ON "consents" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "consents_patient_type_idx" ON "consents" USING btree ("patient_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "consents_patient_type_version_idx" ON "consents" USING btree ("patient_id","type","policy_version");--> statement-breakpoint

-- Backfill consent records from existing intake flags (version 2026-11-01).
INSERT INTO "consents" ("patient_id", "type", "policy_version", "status", "granted_at", "source", "metadata_safe")
SELECT "patient_id", 'PRIVACY_DATA_PROCESSING', '2026-11-01', 'GRANTED'::"consent_status", "privacy_consent_at", 'INTAKE'::"consent_source", 'Backfilled from patient intake'
FROM "patient_intakes"
WHERE "privacy_consent" = 1 AND "privacy_consent_at" IS NOT NULL
ON CONFLICT ("patient_id", "type", "policy_version") DO NOTHING;
--> statement-breakpoint
INSERT INTO "consents" ("patient_id", "type", "policy_version", "status", "granted_at", "withdrawn_at", "source", "metadata_safe")
SELECT "patient_id", 'MEDIA_PUBLICATION', '2026-11-01',
	CASE WHEN "media_consent" = 1 THEN 'GRANTED' ELSE 'WITHDRAWN' END::"consent_status",
	CASE WHEN "media_consent" = 1 THEN COALESCE("privacy_consent_at", "submitted_at", "created_at") ELSE NULL END,
	CASE WHEN "media_consent" = 1 THEN NULL ELSE COALESCE("submitted_at", "created_at") END,
	'INTAKE'::"consent_source", 'Backfilled from patient intake'
FROM "patient_intakes"
WHERE "privacy_consent" = 1
ON CONFLICT ("patient_id", "type", "policy_version") DO NOTHING;
--> statement-breakpoint
INSERT INTO "consents" ("patient_id", "type", "policy_version", "status", "granted_at", "source", "metadata_safe")
SELECT "patient_id", 'CLINICAL_SERVICE', '2026-11-01', 'GRANTED'::"consent_status", "privacy_consent_at", 'INTAKE'::"consent_source", 'Backfilled from patient intake'
FROM "patient_intakes"
WHERE "privacy_consent" = 1 AND "privacy_consent_at" IS NOT NULL
ON CONFLICT ("patient_id", "type", "policy_version") DO NOTHING;
