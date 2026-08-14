ALTER TABLE "patient_intakes" ADD COLUMN "review_message" text;--> statement-breakpoint
ALTER TABLE "patient_intakes" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "patient_intakes" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patient_intakes" ADD CONSTRAINT "patient_intakes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;