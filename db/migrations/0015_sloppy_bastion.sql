CREATE TYPE "public"."patient_gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "gender" "patient_gender" DEFAULT 'MALE';--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "medical_record_number" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_city" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "therapy_goal" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "therapy_diagnosis_label" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "therapy_frequency_text" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "next_therapy_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "therapist_note" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "therapist_note_author" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "therapist_note_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_medical_record_number_unique" UNIQUE("medical_record_number");