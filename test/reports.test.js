import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dbFile = path.join(os.tmpdir(), `discipline-reports-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.DB_FILE = dbFile;
process.env.NODE_ENV = 'test';

let app;
let db;
let adminCookie;

before(async () => {
  ({ app, db } = await import('../server/app.js'));
  const hash = bcrypt.hashSync('AdminPassword123!', 10);
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Test Admin', 'admin-reports@test.local', hash, 'admin');
  const login = await request(app).post('/api/auth/login').send({ email: 'admin-reports@test.local', password: 'AdminPassword123!' });
  assert.equal(login.status, 200);
  adminCookie = login.headers['set-cookie'];
});

after(() => {
  db.close();
  try { fs.unlinkSync(dbFile); } catch { /* temporary database may already be removed */ }
});

test('report endpoint requires authentication', async () => {
  const response = await request(app).get('/api/reports/monthly.pdf');
  assert.equal(response.status, 401);
});

test('report endpoint rejects unsupported periods', async () => {
  const response = await request(app).get('/api/reports/weekly.pdf').set('Cookie', adminCookie);
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'INVALID_PERIOD');
});

test('termly and annual reports return PDFs', async () => {
  for (const period of ['termly', 'annual']) {
    const response = await request(app).get(`/api/reports/${period}.pdf`).set('Cookie', adminCookie);
    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], /application\/pdf/);
    assert.match(response.headers['content-disposition'], new RegExp(`${period}-conduct-report\\.pdf`));
  }
});
