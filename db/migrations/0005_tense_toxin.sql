ALTER TABLE "patient_intakes" ALTER COLUMN "chief_complaint" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_intakes" ALTER COLUMN "affected_area" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_intakes" ALTER COLUMN "daily_limitations" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_intakes" ALTER COLUMN "patient_goal" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "date_of_birth" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "occupation" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_line" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "emergency_contact_relationship" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "emergency_contact_phone" text;