import { bigint, boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const clinicalOrders = pgTable('clinical_orders', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  orderNumber: text('order_number').notNull().unique(), // e.g. ORD-2026-0042
  hospitalName: text('hospital_name').notNull(),
  wardRoom: text('ward_room').notNull(),
  doctorClerkUserId: text('doctor_clerk_user_id'),
  patientIdentifier: text('patient_identifier').notNull(), // hashed or internal hospital MRN
  bloodType: text('blood_type').notNull(), // 'O-', 'O+', 'A-', etc.
  component: text('component').notNull().default('prbc'), // 'prbc' | 'ffp' | 'platelets' | 'cryo'
  unitsRequested: bigint('units_requested', { mode: 'number' }).notNull().default(1),
  urgency: text('urgency').notNull().default('elective'), // 'stat_trauma' | 'urgent_surgery' | 'elective'
  indication: text('indication'), // e.g. 'Postpartum hemorrhage'
  status: text('status').notNull().default('pending'), // 'pending' | 'dispatched' | 'crossmatched' | 'completed' | 'cancelled'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const transfusionLogs = pgTable('transfusion_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  orderId: bigint('order_id', { mode: 'number' }),
  unitBarcode: text('unit_barcode').notNull(),
  patientIdentifier: text('patient_identifier').notNull(),
  clinicianClerkUserId: text('clinician_clerk_user_id').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  hasReaction: boolean('has_reaction').notNull().default(false),
  reactionDetails: jsonb('reaction_details'), // { symptoms: ['fever', 'urticaria'], notes: '' }
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
