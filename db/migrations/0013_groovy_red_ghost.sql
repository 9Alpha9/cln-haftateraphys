CREATE TYPE "public"."therapy_progress_status" AS ENUM('DRAFT', 'FINALIZED');--> statement-breakpoint
CREATE TABLE "therapy_progress_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pain_score" integer NOT NULL,
	"range_of_motion_score" integer NOT NULL,
	"strength_score" integer NOT NULL,
	"function_score" integer NOT NULL,
	"summary" text,
	"status" "therapy_progress_status" DEFAULT 'DRAFT' NOT NULL,
	"patient_visible" integer DEFAULT 0 NOT NULL,
	"finalized_at" timestamp with time zone,
	"finalized_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "therapy_progress_records" ADD CONSTRAINT "therapy_progress_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapy_progress_records" ADD CONSTRAINT "therapy_progress_records_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapy_progress_records" ADD CONSTRAINT "therapy_progress_records_finalized_by_users_id_fk" FOREIGN KEY ("finalized_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "therapy_progress_records_patient_recorded_at_idx" ON "therapy_progress_records" USING btree ("patient_id","recorded_at");--> statement-breakpoint
CREATE INDEX "therapy_progress_records_therapist_idx" ON "therapy_progress_records" USING btree ("therapist_id");