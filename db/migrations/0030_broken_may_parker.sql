CREATE TYPE "public"."document_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('EXAM_RESULT', 'REFERRAL', 'INSURANCE', 'MEDICAL_RECORD', 'CONSENT', 'OTHER');--> statement-breakpoint
CREATE TABLE "patient_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"storage_key" text NOT NULL,
	"original_filename" text,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"document_type" "document_type" DEFAULT 'OTHER' NOT NULL,
	"checksum" text,
	"patient_visible" integer DEFAULT 0 NOT NULL,
	"status" "document_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_documents_patient_id_idx" ON "patient_documents" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_documents_status_idx" ON "patient_documents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_documents_storage_key_idx" ON "patient_documents" USING btree ("storage_key");