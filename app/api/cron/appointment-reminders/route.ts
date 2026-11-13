import { NextResponse } from 'next/server';
import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointments, notifications, patients, users } from '@/db/schema';
import { notifyUser } from '@/server/notify';
import { getAppSettingsUnsafe } from '@/server/queries/app-settings';

export const dynamic = 'force-dynamic';

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const settings = await getAppSettingsUnsafe();
  if (settings.appointment_reminders_enabled !== 'true') {
    return NextResponse.json({ ok: true, sent: 0, disabled: true });
  }
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const tomorrowKey = toDateKey(tomorrow);
  const dayAfterKey = toDateKey(dayAfter);

  const rows = await db
    .select({
      id: appointments.id,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
      patientUserId: patients.userId,
      patientName: patients.fullName,
      therapistName: users.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(appointments.therapistId, users.id))
    .where(
      and(
        inArray(appointments.status, ['SCHEDULED', 'CONFIRMED']),
        gte(appointments.scheduledDate, tomorrowKey),
        lt(appointments.scheduledDate, dayAfterKey),
      ),
    );

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existing = await db
    .select({ userId: notifications.userId })
    .from(notifications)
    .where(
      and(
        eq(notifications.title, 'Pengingat jadwal terapi'),
        gte(notifications.createdAt, todayStart),
      ),
    );
  const alreadyNotified = new Set(existing.map((row) => row.userId));

  let sent = 0;
  for (const row of rows) {
    if (!row.patientUserId || alreadyNotified.has(row.patientUserId)) continue;

    await notifyUser({
      userId: row.patientUserId,
      title: 'Pengingat jadwal terapi',
      message: `Anda memiliki jadwal terapi ${formatDateLabel(tomorrowKey)} pukul ${row.startTime.slice(0, 5)} WIB bersama ${row.therapistName ?? 'fisioterapis Hafta'}.`,
      actionUrl: '/dashboard/appointments',
    });

    alreadyNotified.add(row.patientUserId);
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
