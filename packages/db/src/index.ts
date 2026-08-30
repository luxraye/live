import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { MockPool } from "./mock";

const { Pool } = pg;

const hasRealDb = Boolean(
  process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.startsWith('mock') &&
    !process.env.DATABASE_URL.startsWith('local'),
);

let poolInstance: any;
let dbInstance: any;

if (hasRealDb) {
  try {
    poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });
    dbInstance = drizzle(poolInstance, { schema });
  } catch {
    console.warn('[DB] Failed to connect to DATABASE_URL. Falling back to local in-memory mock mode.');
    poolInstance = new MockPool();
    dbInstance = null;
  }
} else {
  console.info('[DB] DATABASE_URL not set — running in local in-memory mock mode with Botswana healthcare seeds.');
  poolInstance = new MockPool();
  dbInstance = null;
}

export const pool = poolInstance;
export const db = dbInstance;

export * from "./schema";
export * from "./mock";

