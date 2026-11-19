import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Penghitung rate limit yang bertahan lintas instance.
 *
 * Satu baris per kunci (mis. `ip:1.2.3.4:/api/auth/sign-in/email`). `reset_at`
 * menandai akhir jendela; hitungan kembali ke 1 saat jendela lewat.
 */
export const rateLimitHits = pgTable(
  'rate_limit_hits',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull().default(0),
    resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('rate_limit_hits_reset_at_idx').on(table.resetAt)],
);
