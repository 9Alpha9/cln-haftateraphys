CREATE TYPE "public"."intake_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'ACCEPTED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "patient_intakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "intake_status" DEFAULT 'DRAFT' NOT NULL,
	"chief_complaint" text,
	"affected_area" text,
	"onset_description" text,
	"triggering_event" text,
	"aggravating_factors" text,
	"relieving_factors" text,
	"daily_limitations" text,
	"previous_injury_history" text,
	"surgery_history" text,
	"relevant_medical_history" text,
	"current_medication" text,
	"allergies" text,
	"patient_goal" text,
	"data_accuracy_acknowledged" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_intakes" ADD CONSTRAINT "patient_intakes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "patient_intakes_patient_version_idx" ON "patient_intakes" USING btree ("patient_id","version");--> statement-breakpoint
CREATE INDEX "patient_intakes_patient_id_idx" ON "patient_intakes" USING btree ("patient_id");