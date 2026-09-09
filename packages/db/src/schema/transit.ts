import { bigint, doublePrecision, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const transitManifests = pgTable('transit_manifests', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  manifestNumber: text('manifest_number').notNull().unique(), // e.g. TRN-2026-8812
  idempotencyKey: text('idempotency_key').unique(),
  originFacility: text('origin_facility').notNull(),
  destinationFacility: text('destination_facility').notNull(),
  courierClerkUserId: text('courier_clerk_user_id'),
  driverName: text('driver_name').notNull().default('Dispatch Driver'),
  status: text('status').notNull().default('assigned'), // 'assigned' | 'in_transit' | 'delivered' | 'compromised'
  unitBarcodes: jsonb('unit_barcodes').notNull().default([]), // array of blood bag barcodes in crate
  coolerBoxId: text('cooler_box_id'),
  departedAt: timestamp('departed_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  recipientSignature: text('recipient_signature'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const transitTelemetry = pgTable('transit_telemetry', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  manifestId: bigint('manifest_id', { mode: 'number' }).notNull(),
  eventId: text('event_id').unique(),
  temperatureCelsius: doublePrecision('temperature_celsius').notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  isAlertTriggered: text('is_alert_triggered'), // null or alert reason e.g. 'TEMP_HIGH'
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
});
