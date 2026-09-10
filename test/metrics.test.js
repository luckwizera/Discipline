import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dbFile = path.join(os.tmpdir(), `discipline-metrics-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.DB_FILE = dbFile;
process.env.NODE_ENV = 'test';

let app;
let db;
let adminCookie;
let studentCookie;

before(async () => {
  ({ app, db } = await import('../server/app.js'));
  const adminHash = bcrypt.hashSync('AdminPassword123!', 10);
  const studentHash = bcrypt.hashSync('StudentPassword123!', 10);
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Metrics Admin', 'admin-metrics@test.local', adminHash, 'admin');
  db.prepare('INSERT INTO users(name,email,password_hash,role,student_id) VALUES(?,?,?,?,?)').run('Metrics Student', 'student-metrics@test.local', studentHash, 'student', 'ST-1024');
  adminCookie = (await request(app).post('/api/auth/login').send({ email: 'admin-metrics@test.local', password: 'AdminPassword123!' })).headers['set-cookie'];
  studentCookie = (await request(app).post('/api/auth/login').send({ email: 'student-metrics@test.local', password: 'StudentPassword123!' })).headers['set-cookie'];
});

after(() => {
  db.close();
  try { fs.unlinkSync(dbFile); } catch { /* temporary database may already be removed */ }
});

test('metrics endpoint requires authentication', async () => {
  const response = await request(app).get('/api/metrics');
  assert.equal(response.status, 401);
});

test('metrics endpoint is restricted to administrators', async () => {
  const response = await request(app).get('/api/metrics').set('Cookie', studentCookie);
  assert.equal(response.status, 403);
  assert.equal(response.body.code, 'ADMIN_REQUIRED');
});

test('admin can read request metrics', async () => {
  const response = await request(app).get('/api/metrics').set('Cookie', adminCookie);
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.uptimeSeconds, 'number');
  assert.equal(typeof response.body.totalRequests, 'number');
  assert.equal(typeof response.body.byStatus, 'object');
  assert.equal(response.body.totalRequests >= 3, true);
});
