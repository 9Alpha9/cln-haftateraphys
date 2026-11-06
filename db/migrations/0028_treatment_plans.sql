DO $$ BEGIN
  CREATE TYPE "public"."treatment_plan_status" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "treatment_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL,
  "created_by" uuid,
  "goals" text NOT NULL,
  "interventions" text NOT NULL,
  "review_interval_text" text,
  "review_at" timestamp with time zone,
  "precautions" text,
  "status" "treatment_plan_status" DEFAULT 'DRAFT' NOT NULL,
  "patient_visible" integer DEFAULT 0 NOT NULL,
  "activated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "treatment_plans"
    ADD CONSTRAINT "treatment_plans_patient_id_fk"
    FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "treatment_plans"
    ADD CONSTRAINT "treatment_plans_created_by_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "treatment_plans_patient_idx" ON "treatment_plans" USING btree ("patient_id");
