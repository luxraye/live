import { bigint, pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const feedbackResponses = pgTable('feedback_responses', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: text('clerk_user_id'),
  sessionId: text('session_id'),
  responses: jsonb('responses').notNull(),
  appVersion: text('app_version'),
  platform: text('platform'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});