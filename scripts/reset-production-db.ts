import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

const TABLES = [
  'audit_logs',
  'notifications',
  'appointment_notification_reads',
  'internal_calendar_events',
  'home_program_items',
  'home_programs',
  'patient_intakes',
  'appointments',
  'patient_assignments',
  'patients',
  'accounts',
  'sessions',
  'profiles',
  'verifications',
  'users',
];

const run = async () => {
  const db = getDb();
  const confirm = process.env.CONFIRM_RESET;
  if (confirm !== 'true') {
    throw new Error(
      'Set CONFIRM_RESET=true to run this destructive script. This will DELETE ALL DATA.',
    );
  }

  for (const table of TABLES) {
    console.log(`Truncating ${table}...`);
    await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }

  console.log('All tables truncated. Database reset complete.');
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
  });
