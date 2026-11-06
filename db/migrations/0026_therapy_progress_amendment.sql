ALTER TABLE "therapy_progress_records" ADD COLUMN IF NOT EXISTS "amended_from_id" uuid;
ALTER TABLE "therapy_progress_records" ADD COLUMN IF NOT EXISTS "revision_number" integer DEFAULT 1 NOT NULL;
ALTER TABLE "therapy_progress_records" ADD COLUMN IF NOT EXISTS "amendment_reason" text;
ALTER TABLE "therapy_progress_records" ADD COLUMN IF NOT EXISTS "superseded_at" timestamp with time zone;
DO $$ BEGIN
  ALTER TABLE "therapy_progress_records"
    ADD CONSTRAINT "therapy_progress_records_amended_from_id_fk"
    FOREIGN KEY ("amended_from_id") REFERENCES "public"."therapy_progress_records"("id") ON DELETE restrict;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "therapy_progress_records_amended_from_idx" ON "therapy_progress_records" USING btree ("amended_from_id");
