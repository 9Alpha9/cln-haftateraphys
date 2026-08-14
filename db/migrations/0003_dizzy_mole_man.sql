CREATE TYPE "public"."home_program_item_status" AS ENUM('ACTIVE', 'PAUSED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."home_program_status" AS ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "home_program_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_program_id" uuid NOT NULL,
	"name" text NOT NULL,
	"instruction" text NOT NULL,
	"sets" integer,
	"repetitions" integer,
	"duration_seconds" integer,
	"frequency_text" text,
	"precaution" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "home_program_item_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"treatment_plan_id" uuid,
	"status" "home_program_status" DEFAULT 'DRAFT' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"patient_visible" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "home_program_items" ADD CONSTRAINT "home_program_items_home_program_id_home_programs_id_fk" FOREIGN KEY ("home_program_id") REFERENCES "public"."home_programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_programs" ADD CONSTRAINT "home_programs_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_programs" ADD CONSTRAINT "home_programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "home_program_items_program_id_idx" ON "home_program_items" USING btree ("home_program_id");--> statement-breakpoint
CREATE INDEX "home_programs_patient_id_idx" ON "home_programs" USING btree ("patient_id");