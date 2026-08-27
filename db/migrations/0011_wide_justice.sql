ALTER TABLE "appointment_notification_reads" DROP CONSTRAINT "appointment_notification_reads_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_therapist_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "home_programs" DROP CONSTRAINT "home_programs_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "patient_assignments" DROP CONSTRAINT "patient_assignments_staff_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "patient_assignments" DROP CONSTRAINT "patient_assignments_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "internal_calendar_events" DROP CONSTRAINT "internal_calendar_events_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "patient_intakes" DROP CONSTRAINT "patient_intakes_reviewed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "appointment_notification_reads" ADD CONSTRAINT "appointment_notification_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_programs" ADD CONSTRAINT "home_programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_assignments" ADD CONSTRAINT "patient_assignments_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_assignments" ADD CONSTRAINT "patient_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_calendar_events" ADD CONSTRAINT "internal_calendar_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_intakes" ADD CONSTRAINT "patient_intakes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;