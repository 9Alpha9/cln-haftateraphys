CREATE TABLE "therapist_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_time_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "therapist_schedules" ADD CONSTRAINT "therapist_schedules_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_time_off" ADD CONSTRAINT "therapist_time_off_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_time_off" ADD CONSTRAINT "therapist_time_off_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "therapist_schedules_therapist_id_idx" ON "therapist_schedules" USING btree ("therapist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "therapist_schedules_slot_unique_idx" ON "therapist_schedules" USING btree ("therapist_id","day_of_week","start_time","end_time");--> statement-breakpoint
CREATE INDEX "therapist_time_off_therapist_id_idx" ON "therapist_time_off" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_time_off_date_idx" ON "therapist_time_off" USING btree ("start_date","end_date");