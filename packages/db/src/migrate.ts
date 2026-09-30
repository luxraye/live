import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.startsWith('mock') || databaseUrl.startsWith('local')) {
    console.log('[Migrate] No valid DATABASE_URL provided. Skipping PostgreSQL migrations.');
    return;
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  console.log('[Migrate] Connecting to database to apply migrations...');

  const drizzleDir = path.resolve(__dirname, '../drizzle');
  if (!fs.existsSync(drizzleDir)) {
    console.warn(`[Migrate] Drizzle directory not found at ${drizzleDir}`);
    await pool.end();
    return;
  }

  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "__bloodchain_migrations" (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const files = fs.readdirSync(drizzleDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const check = await pool.query('SELECT 1 FROM "__bloodchain_migrations" WHERE name = $1', [file]);
    if (check.rowCount === 0) {
      console.log(`[Migrate] Applying migration: ${file}...`);
      const sqlContent = fs.readFileSync(path.join(drizzleDir, file), 'utf-8');
      const statements = sqlContent.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);
      for (const statement of statements) {
        if (statement.length > 0) {
          await pool.query(statement);
        }
      }
      await pool.query('INSERT INTO "__bloodchain_migrations" (name) VALUES ($1)', [file]);
      console.log(`[Migrate] Successfully applied: ${file}`);
    } else {
      console.log(`[Migrate] Already applied: ${file}`);
    }
  }

  await pool.end();
  console.log('[Migrate] All migrations completed successfully.');
}

runMigrations().catch((err) => {
  console.error('[Migrate] Migration failed:', err);
  process.exit(1);
});
