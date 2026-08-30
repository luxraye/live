import { bigint, boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const donorProfiles = pgTable("donor_profiles", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  bloodType: text("blood_type"),
  district: text("district"),
  phone: text("phone"),
  locationEnabled: boolean("location_enabled").notNull().default(false),
  verificationLevel: bigint("verification_level", { mode: "number" }).notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const donorDocuments = pgTable("donor_documents", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: text("clerk_user_id").notNull(),
  objectPath: text("object_path").notNull().unique(),
  documentType: text("document_type").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const uploadGrants = pgTable("upload_grants", {
  objectPath: text("object_path").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});