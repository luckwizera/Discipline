import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const db = new Database(process.env.DB_FILE || path.join(here, 'discipline.sqlite'));
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','student')), student_id TEXT);
CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, name TEXT NOT NULL, class_name TEXT NOT NULL, parent_email TEXT, parent_phone TEXT, marks INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Good');
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT NOT NULL REFERENCES students(id), type TEXT NOT NULL, amount INTEGER NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL, created_by INTEGER, notified INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS permissions (code TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id), reason TEXT NOT NULL, out_time TEXT NOT NULL, back_time TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Pending', created_at TEXT NOT NULL);
`);

export function seedDemoStudents() {
  if (db.prepare('SELECT COUNT(*) AS n FROM students').get().n) return;
  const insert = db.prepare('INSERT INTO students VALUES (?,?,?,?,?,?,?)');
  const rows = [
    ['ST-1024','Aline Uwase','S4 A','parent@example.com','+250000000000',8,'Good'],
    ['ST-1041','Brian Mugisha','S3 B','parent@example.com','+250000000001',14,'Watch'],
    ['ST-1068','Clara Ishimwe','S5 C','parent@example.com','+250000000002',3,'Good'],
    ['ST-1089','David Niyonzima','S2 A','parent@example.com','+250000000003',19,'Review']
  ];
  const transaction = db.transaction(() => rows.forEach(row => insert.run(...row)));
  transaction();
}
export function checkDatabase() { return db.prepare('SELECT 1 AS ok').get().ok === 1; }
