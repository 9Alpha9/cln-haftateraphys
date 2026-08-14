import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientAssignments, patients, profiles, users } from '@/db/schema';
import { auth } from '@/lib/auth';

/**
 * Adds 5 dummy patient records (each backed by a USER account) for local dev/
 * testing only. Uses a non-routable `.test` email domain. Remove before deploy
 * with `pnpm db:seed:dummy:remove` (add a matching cleanup for patient rows).
 */
const DUMMY_DOMAIN = '.test';

const dummyPatients = [
  {
    fullName: 'Ahmad Fauzi',
    email: 'patient1@dummy.hafta.test',
    password: 'DummyP1!2026',
    dateOfBirth: new Date('1990-05-12'),
    occupation: 'Karyawan Swasta',
    addressLine: 'Jl. Melati No. 4, Sidoarjo',
    emergencyContactName: 'Siti Fauzi',
    emergencyContactRelationship: 'Istri',
    emergencyContactPhone: '0811-9900-0001',
    caseStatus: 'ACTIVE' as const,
  },
  {
    fullName: 'Maya Puspita',
    email: 'patient2@dummy.hafta.test',
    password: 'DummyP2!2026',
    dateOfBirth: new Date('1985-11-03'),
    occupation: 'Ibu Rumah Tangga',
    addressLine: 'Perum Griya Asri Blok C2, Sidoarjo',
    emergencyContactName: 'Agus Puspita',
    emergencyContactRelationship: 'Suami',
    emergencyContactPhone: '0811-9900-0002',
    caseStatus: 'INTAKE' as const,
  },
  {
    fullName: 'Rizky Pratama',
    email: 'patient3@dummy.hafta.test',
    password: 'DummyP3!2026',
    dateOfBirth: new Date('1998-02-21'),
    occupation: 'Mahasiswa',
    addressLine: 'Jl. Kenanga No. 21, Surabaya',
    emergencyContactName: 'Budi Pratama',
    emergencyContactRelationship: 'Ayah',
    emergencyContactPhone: '0811-9900-0003',
    caseStatus: 'ACTIVE' as const,
  },
  {
    fullName: 'Nurul Aini',
    email: 'patient4@dummy.hafta.test',
    password: 'DummyP4!2026',
    dateOfBirth: new Date('1993-07-17'),
    occupation: 'Guru',
    addressLine: 'Jl. Anggrek No. 9, Gresik',
    emergencyContactName: 'Yusuf Aini',
    emergencyContactRelationship: 'Suami',
    emergencyContactPhone: '0811-9900-0004',
    caseStatus: 'ACTIVE' as const,
  },
  {
    fullName: 'Dimas Aditya',
    email: 'patient5@dummy.hafta.test',
    password: 'DummyP5!2026',
    dateOfBirth: new Date('1988-09-30'),
    occupation: 'Wiraswasta',
    addressLine: 'Jl. Cemara Raya No. 15, Sidoarjo',
    emergencyContactName: 'Rina Aditya',
    emergencyContactRelationship: 'Istri',
    emergencyContactPhone: '0811-9900-0005',
    caseStatus: 'COMPLETED' as const,
  },
  {
    fullName: 'Putri Handayani',
    email: 'patient6@dummy.hafta.test',
    password: 'DummyP6!2026',
    dateOfBirth: new Date('1995-01-15'),
    occupation: 'Desainer Grafis',
    addressLine: 'Jl. Dahlia No. 7, Surabaya',
    emergencyContactName: 'Bambang Handayani',
    emergencyContactRelationship: 'Ayah',
    emergencyContactPhone: '0811-9900-0006',
    caseStatus: 'ON_HOLD' as const,
  },
  {
    fullName: 'Yoga Saputra',
    email: 'patient7@dummy.hafta.test',
    password: 'DummyP7!2026',
    dateOfBirth: new Date('1992-03-08'),
    occupation: 'Atlet Amatir',
    addressLine: 'Jl. Mawar No. 12, Gresik',
    emergencyContactName: 'Dewi Saputra',
    emergencyContactRelationship: 'Ibu',
    emergencyContactPhone: '0811-9900-0007',
    caseStatus: 'ACTIVE' as const,
  },
  {
    fullName: 'Rina Marlina',
    email: 'patient8@dummy.hafta.test',
    password: 'DummyP8!2026',
    dateOfBirth: new Date('1987-06-25'),
    occupation: 'Akuntan',
    addressLine: 'Perum Citra Indah Blok A5, Sidoarjo',
    emergencyContactName: 'Hadi Marlina',
    emergencyContactRelationship: 'Suami',
    emergencyContactPhone: '0811-9900-0008',
    caseStatus: 'INTAKE' as const,
  },
  {
    fullName: 'Fajar Ramadhan',
    email: 'patient9@dummy.hafta.test',
    password: 'DummyP9!2026',
    dateOfBirth: new Date('2000-11-11'),
    occupation: 'Mahasiswa',
    addressLine: 'Jl. Teratai No. 3, Surabaya',
    emergencyContactName: 'Nani Ramadhan',
    emergencyContactRelationship: 'Ibu',
    emergencyContactPhone: '0811-9900-0009',
    caseStatus: 'ACTIVE' as const,
  },
  {
    fullName: 'Sari Purnama',
    email: 'patient10@dummy.hafta.test',
    password: 'DummyP10!2026',
    dateOfBirth: new Date('1991-12-02'),
    occupation: 'PNS',
    addressLine: 'Jl. Cempaka No. 18, Sidoarjo',
    emergencyContactName: 'Arif Purnama',
    emergencyContactRelationship: 'Suami',
    emergencyContactPhone: '0811-9900-0010',
    caseStatus: 'REFERRED' as const,
  },
];

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed dummy patients in production.');
  }

  const db = getDb();

  const [therapist] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'therapist@dummy.hafta.test'))
    .limit(1);

  if (!therapist) {
    throw new Error('Dummy therapist not found. Run `pnpm db:seed:dummy` first.');
  }

  for (const p of dummyPatients) {
    const email = p.email.toLowerCase();

    const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`OK   ${email} already exists`);
    } else {
      const res = await auth.api.signUpEmail({
        body: { name: p.fullName, email, password: p.password },
      });
      const id = (res as { user?: { id: string } }).user?.id ?? (res as { id?: string }).id;
      if (!id) {
        console.error(`FAILED create user for ${email}`);
        continue;
      }
      userId = id;
    }

    await db
      .insert(profiles)
      .values({ userId, displayName: p.fullName, accountType: 'USER' })
      .onConflictDoNothing({ target: profiles.userId });

    const [existingPatient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);

    let patientId: string;

    if (existingPatient) {
      patientId = existingPatient.id;
      console.log(`SKIP patient record for ${email} (already exists)`);
    } else {
      const [inserted] = await db
        .insert(patients)
        .values({
          userId,
          fullName: p.fullName,
          dateOfBirth: p.dateOfBirth,
          occupation: p.occupation,
          addressLine: p.addressLine,
          emergencyContactName: p.emergencyContactName,
          emergencyContactRelationship: p.emergencyContactRelationship,
          emergencyContactPhone: p.emergencyContactPhone,
          caseStatus: p.caseStatus,
        })
        .returning({ id: patients.id });
      patientId = inserted.id;
      console.log(`OK   patient "${p.fullName}" created for ${email}`);
    }

    const [existingAssignment] = await db
      .select({ id: patientAssignments.id })
      .from(patientAssignments)
      .where(eq(patientAssignments.patientId, patientId))
      .limit(1);

    if (existingAssignment) {
      console.log(`SKIP assignment for ${email} (already assigned)`);
      continue;
    }

    await db.insert(patientAssignments).values({
      patientId,
      staffUserId: therapist.id,
      assignmentType: 'PRIMARY_THERAPIST',
      createdBy: therapist.id,
    });
    console.log(`OK   assigned "${p.fullName}" -> therapist`);
  }

  console.log(`Seeding dummy patients completed (${DUMMY_DOMAIN}).`);
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
