import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const hasRenderDataDisk = process.env.RENDER === 'true'
  && fs.existsSync('/var/data');
const configured = process.env.DATABASE_PATH
  || (hasRenderDataDisk ? '/var/data/app.db' : './data/projects.db');
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

const projectColumns = db.prepare('PRAGMA table_info(projects)').all();
if (!projectColumns.some(column => column.name === 'tags')) {
  db.exec("ALTER TABLE projects ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'");
}

db.exec(`CREATE TABLE IF NOT EXISTS project_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  rater_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, rater_id),
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
)`);
export default db;
