import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dbFile = path.join(os.tmpdir(), `discipline-permissions-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.DB_FILE = dbFile;
process.env.NODE_ENV = 'test';

let app;
let db;
let adminCookie;
let studentCookie;

before(async () => {
  ({ app, db } = await import('../server/app.js'));
  const hash = bcrypt.hashSync('AdminPassword123!', 10);
  const studentHash = bcrypt.hashSync('StudentPassword123!', 10);
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Test Admin', 'admin@test.local', hash, 'admin');
  db.prepare('INSERT INTO users(name,email,password_hash,role,student_id) VALUES(?,?,?,?,?)').run('Test Student', 'student@test.local', studentHash, 'student', 'ST-1024');
  adminCookie = (await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'AdminPassword123!' })).headers['set-cookie'];
  studentCookie = (await request(app).post('/api/auth/login').send({ email: 'student@test.local', password: 'StudentPassword123!' })).headers['set-cookie'];
});

after(() => {
  db.close();
  try { fs.unlinkSync(dbFile); } catch { /* temporary database may already be removed */ }
});

test('permission creation rejects unknown student', async () => {
  const response = await request(app).post('/api/permissions').set('Cookie', adminCookie).send({ studentId: 'ST-9999', reason: 'Appointment', outTime: '2026-09-02T14:00:00.000Z', backTime: '2026-09-02T16:00:00.000Z' });
  assert.equal(response.status, 404);
  assert.equal(response.body.code, 'STUDENT_NOT_FOUND');
});

test('permission creation rejects invalid times', async () => {
  const response = await request(app).post('/api/permissions').set('Cookie', adminCookie).send({ studentId: 'ST-1024', reason: 'Appointment', outTime: 'not-a-date', backTime: '2026-09-02T16:00:00.000Z' });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('student cannot create a permission card', async () => {
  const response = await request(app).post('/api/permissions').set('Cookie', studentCookie).send({ studentId: 'ST-1024', reason: 'Appointment', outTime: '2026-09-02T14:00:00.000Z', backTime: '2026-09-02T16:00:00.000Z' });
  assert.equal(response.status, 403);
  assert.equal(response.body.code, 'ADMIN_REQUIRED');
});

test('permission status rejects unsupported value', async () => {
  const created = await request(app).post('/api/permissions').set('Cookie', adminCookie).send({ studentId: 'ST-1024', reason: 'Appointment', outTime: '2026-09-02T14:00:00.000Z', backTime: '2026-09-02T16:00:00.000Z' });
  assert.equal(created.status, 201);
  const response = await request(app).patch(`/api/permissions/${created.body.code}`).set('Cookie', adminCookie).send({ status: 'Maybe' });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('permission status returns not found for unknown card', async () => {
  const response = await request(app).patch('/api/permissions/EC-NOTFOUND').set('Cookie', adminCookie).send({ status: 'Approved' });
  assert.equal(response.status, 404);
  assert.equal(response.body.code, 'PERMISSION_NOT_FOUND');
});
