import { bigint, pgTable, text, timestamp, doublePrecision, boolean } from 'drizzle-orm/pg-core';

export const donationRequests = pgTable('donation_requests', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  bloodType: text('blood_type').notNull(),
  priority: text('priority').notNull().default('planned'),
  facilityName: text('facility_name').notNull(),
  description: text('description').notNull(),
  district: text('district'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  responseCount: bigint('response_count', { mode: 'number' }).notNull().default(0),
  isOpen: boolean('is_open').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
});

export const requestResponses = pgTable('request_responses', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  requestId: bigint('request_id', { mode: 'number' }).notNull(),
  clerkUserId: text('clerk_user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});