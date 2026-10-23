import { describe, expect, it } from 'vitest';
import {
  saveTherapistScheduleSchema,
  therapistTimeOffSchema,
} from '@/lib/validators/therapist-availability';

const therapistId = '00000000-0000-4000-8000-000000000001';

describe('therapist schedule validation', () => {
  it('accepts non-overlapping blocks on the same day', () => {
    const result = saveTherapistScheduleSchema.safeParse({
      therapistId,
      entries: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
        { dayOfWeek: 1, startTime: '13:00', endTime: '17:00' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects overlapping blocks on the same day', () => {
    const result = saveTherapistScheduleSchema.safeParse({
      therapistId,
      entries: [
        { dayOfWeek: 2, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 2, startTime: '11:00', endTime: '14:00' },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects end time before start time', () => {
    const result = saveTherapistScheduleSchema.safeParse({
      therapistId,
      entries: [{ dayOfWeek: 3, startTime: '15:00', endTime: '14:00' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects time off with end date before start date', () => {
    const result = therapistTimeOffSchema.safeParse({
      therapistId,
      startDate: '2026-10-20',
      endDate: '2026-10-19',
    });

    expect(result.success).toBe(false);
  });
});

