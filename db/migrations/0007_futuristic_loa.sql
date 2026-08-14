CREATE TABLE "appointment_notification_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_notification_reads" ADD CONSTRAINT "appointment_notification_reads_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_notification_reads" ADD CONSTRAINT "appointment_notification_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_notification_reads_appointment_user_idx" ON "appointment_notification_reads" USING btree ("appointment_id","user_id");--> statement-breakpoint
CREATE INDEX "appointment_notification_reads_user_id_idx" ON "appointment_notification_reads" USING btree ("user_id");