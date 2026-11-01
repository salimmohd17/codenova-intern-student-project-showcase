import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Configure it in the backend environment.');
}

const databaseUrl = new URL(process.env.DATABASE_URL);
const isRemote = !['localhost', '127.0.0.1'].includes(databaseUrl.hostname);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', error => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(here, '../migrations');
let migrationPromise;

export async function initializeDatabase() {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          name TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const applied = await client.query('SELECT name FROM schema_migrations');
      const appliedNames = new Set(applied.rows.map(row => row.name));
      const files = (await fs.readdir(migrationsDirectory))
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of files) {
        if (appliedNames.has(file)) continue;
        const sql = await fs.readFile(path.join(migrationsDirectory, file), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      migrationPromise = undefined;
      throw error;
    } finally {
      client.release();
    }
  })();

  return migrationPromise;
}

export const query = (text, params) => pool.query(text, params);
export const getPool = () => pool;
export default pool;
