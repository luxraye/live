import { bigint, boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const healthArticles = pgTable('health_articles', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  bodyMarkdown: text('body_markdown').notNull().default(''),
  topic: text('topic').notNull().default('general'),
  readTimeMinutes: bigint('read_time_minutes', { mode: 'number' }).notNull().default(5),
  iconName: text('icon_name').notNull().default('heart'),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});