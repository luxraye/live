import { bigint, boolean, doublePrecision, pgTable, text, timestamp, time } from 'drizzle-orm/pg-core';

export const donationCentres = pgTable('donation_centres', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  kind: text('kind').notNull().default('clinic'),
  address: text('address'),
  district: text('district'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  phone: text('phone'),
  isOpen: boolean('is_open').notNull().default(true),
  opensAt: time('opens_at'),
  closesAt: time('closes_at'),
  acceptsWalkIns: boolean('accepts_walk_ins').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});