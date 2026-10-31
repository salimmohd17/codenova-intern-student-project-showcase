import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const configured = process.env.DATABASE_PATH || './data/projects.db';
const dbPath = path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL,
  github_url TEXT NOT NULL,
  demo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  review_note TEXT
);`);
export default db;
