import { bigint, boolean, doublePrecision, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const bloodUnits = pgTable('blood_units', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  bagBarcode: text('bag_barcode').notNull().unique(), // e.g. UNIT-BOTS-2026-9901
  donationTxId: text('donation_tx_id'), // links to Fabric ledger txId
  donorHash: text('donor_hash').notNull(),
  bloodType: text('blood_type').notNull(), // 'O-', 'O+', 'A-', etc.
  componentType: text('component_type').notNull().default('whole_blood'), // 'whole_blood' | 'prbc' | 'ffp' | 'platelets' | 'cryo'
  volumeMl: doublePrecision('volume_ml').notNull().default(450),
  status: text('status').notNull().default('quarantined'), // 'quarantined' | 'tested_passed' | 'fractionated' | 'issued' | 'expired' | 'disposed'
  vaultLocation: text('vault_location'), // e.g. 'Cold Vault A · Shelf 2B'
  isReactive: boolean('is_reactive').notNull().default(false), // true if viral screening failed
  viralMarkers: jsonb('viral_markers'), // { hiv: 'non_reactive', hbv: 'non_reactive', hcv: 'non_reactive', syphilis: 'non_reactive' }
  testedByClerkUserId: text('tested_by_clerk_user_id'),
  collectedAt: timestamp('collected_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
