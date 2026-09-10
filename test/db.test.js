import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dbFile = path.join(os.tmpdir(), `discipline-db-test-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_FILE = dbFile;

let db;
let seedDemoStudents;
let checkDatabase;

before(async () => {
  ({ db, seedDemoStudents, checkDatabase } = await import('../server/db.js'));
});

after(() => {
  db.close();
  for (const suffix of ['', '-shm', '-wal']) {
    try { fs.unlinkSync(`${dbFile}${suffix}`); } catch { /* temporary file may not exist */ }
  }
});

test('database enables foreign keys and reports healthy', () => {
  assert.equal(db.pragma('foreign_keys', { simple: true }), 1);
  assert.equal(checkDatabase(), true);
});

test('demo student seeding is idempotent', () => {
  seedDemoStudents();
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM students').get().n, 4);
  const first = db.prepare('SELECT marks, status FROM students WHERE id = ?').get('ST-1041');
  assert.deepEqual(first, { marks: 14, status: 'Watch' });
  seedDemoStudents();
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM students').get().n, 4);
});
