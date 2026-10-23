ALTER TABLE "appointments" ADD COLUMN "completion_note" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "completed_by" uuid;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "case_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "case_completed_by" uuid;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "case_completion_summary" text;--> statement-breakpoint
ALTER TABLE "therapy_progress_records" ADD COLUMN "appointment_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_case_completed_by_users_id_fk" FOREIGN KEY ("case_completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapy_progress_records" ADD CONSTRAINT "therapy_progress_records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "therapy_progress_records_appointment_idx" ON "therapy_progress_records" USING btree ("appointment_id");