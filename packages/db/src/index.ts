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

class HybridPool {
  private realPool: any = null;
  private mockPool: MockPool;

  constructor(connectionString?: string) {
    this.mockPool = new MockPool();
    if (connectionString) {
      try {
        this.realPool = new Pool({ connectionString });
      } catch (err) {
        console.warn('[DB] Failed to create pg.Pool. Using in-memory mock store.');
        this.realPool = null;
      }
    }
  }

  async query(text: string, params?: any[]) {
    if (this.realPool) {
      try {
        return await this.realPool.query(text, params);
      } catch (err: any) {
        console.warn(`[DB] PostgreSQL query failed (${err?.message || err}). Falling back to mock store for query:`, text.slice(0, 60));
        return await this.mockPool.query(text, params);
      }
    }
    return await this.mockPool.query(text, params);
  }

  on(event: string, handler: any) {
    if (this.realPool && typeof this.realPool.on === 'function') {
      this.realPool.on(event, handler);
    }
  }

  end() {
    return this.realPool?.end();
  }
}

let poolInstance: any;
let dbInstance: any;

if (hasRealDb) {
  poolInstance = new HybridPool(process.env.DATABASE_URL);
  try {
    const rawPool = new Pool({ connectionString: process.env.DATABASE_URL });
    dbInstance = drizzle(rawPool, { schema });
  } catch {
    dbInstance = null;
  }
} else {
  console.info('[DB] DATABASE_URL not set — running in local in-memory mock mode with Botswana healthcare seeds.');
  poolInstance = new HybridPool();
  dbInstance = null;
}

export const pool = poolInstance;
export const db = dbInstance;

export * from "./schema";
export * from "./mock";

