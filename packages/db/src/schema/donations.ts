import { bigint, pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const donorDonations = pgTable('donor_donations', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: text('clerk_user_id').notNull(),
  centreId: bigint('centre_id', { mode: 'number' }),
  centreName: text('centre_name'),
  donatedAt: timestamp('donated_at', { withTimezone: true }).notNull(),
  verified: boolean('verified').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});