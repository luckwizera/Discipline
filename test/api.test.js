import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dbFile = path.join(os.tmpdir(), `discipline-test-${process.pid}-${Date.now()}.sqlite`);
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
  const login = await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'AdminPassword123!' });
  const studentLogin = await request(app).post('/api/auth/login').send({ email: 'student@test.local', password: 'StudentPassword123!' });
  assert.equal(login.status, 200);
  assert.equal(studentLogin.status, 200);
  adminCookie = login.headers['set-cookie'];
  studentCookie = studentLogin.headers['set-cookie'];
});

after(() => {
  db.close();
  try { fs.unlinkSync(dbFile); } catch { /* temp database may already be removed */ }
});

test('health endpoint reports database health', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok', database: 'ok' });
});

test('API responses include baseline security headers', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'DENY');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  assert.equal(response.headers['permissions-policy'], 'camera=(), microphone=(), geolocation=()');
});

test('login sets secure cookie attributes', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'AdminPassword123!' });
  assert.equal(response.status, 200);
  const cookie = response.headers['set-cookie'].find((value) => value.startsWith('ecard='));
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Max-Age=28800/i);
});

test('login validation rejects malformed requests', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'short' });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('login rejects invalid credentials', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'wrong-password' });
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'LOGIN_FAILED');
});

test('authenticated user can read their session', async () => {
  const response = await request(app).get('/api/auth/me').set('Cookie', adminCookie);
  assert.equal(response.status, 200);
  assert.equal(response.body.role, 'admin');
  assert.equal(response.body.email, undefined);
  assert.equal(response.body.id > 0, true);
});

test('logout clears the authentication cookie', async () => {
  const response = await request(app).post('/api/auth/logout').set('Cookie', adminCookie);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { ok: true });
  assert.deepEqual(response.headers['set-cookie'].join(';'), 'ecard=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
});

test('protected endpoints reject missing credentials', async () => {
  const response = await request(app).get('/api/students');
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'AUTH_REQUIRED');
});

test('protected endpoints reject malformed bearer tokens', async () => {
  const response = await request(app).get('/api/students').set('Authorization', 'Bearer definitely-not-a-jwt');
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'AUTH_INVALID');
});

test('protected endpoints accept valid bearer tokens', async () => {
  const { signUser } = await import('../server/auth.js');
  const token = signUser({ id: 1, role: 'admin', student_id: null });
  const response = await request(app).get('/api/students').set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.equal(Array.isArray(response.body), true);
});

test('student cannot access administration student list', async () => {
  const response = await request(app).get('/api/students').set('Cookie', studentCookie);
  assert.equal(response.status, 403);
  assert.equal(response.body.code, 'ADMIN_REQUIRED');
});

test('admin can list students', async () => {
  const response = await request(app).get('/api/students').set('Cookie', adminCookie);
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 4);
});

test('metrics are protected and record API responses', async () => {
  const forbidden = await request(app).get('/api/metrics').set('Cookie', studentCookie);
  assert.equal(forbidden.status, 403);
  const response = await request(app).get('/api/metrics').set('Cookie', adminCookie);
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.uptimeSeconds, 'number');
  assert.equal(typeof response.body.totalRequests, 'number');
  assert.equal(response.body.totalRequests > 0, true);
  assert.equal(response.body.byStatus['200'] > 0, true);
});

test('appreciation increases marks and creates history', async () => {
  const response = await request(app).post('/api/events').set('Cookie', adminCookie).send({ studentId: 'ST-1024', type: 'Appreciation', amount: 3, reason: 'Excellent teamwork', notifyParent: false });
  assert.equal(response.status, 200);
  assert.equal(response.body.marks, 11);
  assert.equal(response.body.status, 'Good');
  const history = await request(app).get('/api/students/ST-1024/history').set('Cookie', adminCookie);
  assert.equal(history.body[0].type, 'Appreciation');
});

test('sanction never pushes marks below zero', async () => {
  const response = await request(app).post('/api/events').set('Cookie', adminCookie).send({ studentId: 'ST-1068', type: 'Sanction', amount: 20, reason: 'Policy violation', notifyParent: true });
  assert.equal(response.status, 200);
  assert.equal(response.body.marks, 0);
});

test('invalid conduct payload is rejected before persistence', async () => {
  const response = await request(app).post('/api/events').set('Cookie', adminCookie).send({ studentId: 'ST-1024', type: 'Sanction', amount: 99, reason: '' });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('conduct status thresholds are enforced', async () => {
  const { calculateConductStatus } = await import('../server/routes/events.js');
  assert.equal(calculateConductStatus(0), 'Good');
  assert.equal(calculateConductStatus(11), 'Good');
  assert.equal(calculateConductStatus(12), 'Watch');
  assert.equal(calculateConductStatus(17), 'Watch');
  assert.equal(calculateConductStatus(18), 'Review');
});

test('student sees only their own permission cards', async () => {
  const response = await request(app).get('/api/permissions').set('Cookie', studentCookie);
  assert.equal(response.status, 200);
  assert.equal(response.body.every((card) => card.student_id === 'ST-1024'), true);
});

test('permission card can be created and approved', async () => {
  const created = await request(app).post('/api/permissions').set('Cookie', adminCookie).send({ studentId: 'ST-1024', reason: 'Medical appointment', outTime: '2026-09-02T14:00:00.000Z', backTime: '2026-09-02T16:00:00.000Z' });
  assert.equal(created.status, 201);
  const approved = await request(app).patch(`/api/permissions/${created.body.code}`).set('Cookie', adminCookie).send({ status: 'Approved' });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.status, 'Approved');
});

test('monthly report returns a PDF', async () => {
  const response = await request(app).get('/api/reports/monthly.pdf').set('Cookie', adminCookie);
  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /application\/pdf/);
});
