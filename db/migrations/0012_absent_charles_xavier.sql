ALTER TABLE "appointment_notification_reads" DROP CONSTRAINT "appointment_notification_reads_appointment_id_appointments_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_patient_id_patients_id_fk";
--> statement-breakpoint
ALTER TABLE "home_program_items" DROP CONSTRAINT "home_program_items_home_program_id_home_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "home_programs" DROP CONSTRAINT "home_programs_patient_id_patients_id_fk";
--> statement-breakpoint
ALTER TABLE "patient_assignments" DROP CONSTRAINT "patient_assignments_patient_id_patients_id_fk";
--> statement-breakpoint
ALTER TABLE "patient_intakes" DROP CONSTRAINT "patient_intakes_patient_id_patients_id_fk";
--> statement-breakpoint
ALTER TABLE "appointment_notification_reads" ADD CONSTRAINT "appointment_notification_reads_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_program_items" ADD CONSTRAINT "home_program_items_home_program_id_home_programs_id_fk" FOREIGN KEY ("home_program_id") REFERENCES "public"."home_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_programs" ADD CONSTRAINT "home_programs_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_assignments" ADD CONSTRAINT "patient_assignments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_intakes" ADD CONSTRAINT "patient_intakes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;