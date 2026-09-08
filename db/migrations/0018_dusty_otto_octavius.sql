ALTER TABLE "therapy_progress_records" DROP CONSTRAINT "therapy_progress_records_therapist_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "therapy_progress_records" DROP CONSTRAINT "therapy_progress_records_finalized_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "therapy_progress_records" ALTER COLUMN "therapist_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "therapy_progress_records" ADD CONSTRAINT "therapy_progress_records_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapy_progress_records" ADD CONSTRAINT "therapy_progress_records_finalized_by_users_id_fk" FOREIGN KEY ("finalized_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;