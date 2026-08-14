CREATE TYPE "public"."calendar_event_type" AS ENUM('CLINIC_CLOSURE', 'TRAINING', 'INTERNAL_EVENT', 'IMPORTANT_NOTICE');--> statement-breakpoint
CREATE TABLE "internal_calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_type" "calendar_event_type" NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"start_time" text,
	"end_time" text,
	"patient_visible" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "internal_calendar_events" ADD CONSTRAINT "internal_calendar_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "internal_calendar_events_date_idx" ON "internal_calendar_events" USING btree ("scheduled_date");