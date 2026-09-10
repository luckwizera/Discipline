import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dbFile = path.join(os.tmpdir(), `discipline-notifications-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.DB_FILE = dbFile;
process.env.NODE_ENV = 'test';
delete process.env.SMTP_HOST;

let app;
let db;
let adminCookie;

before(async () => {
  ({ app, db } = await import('../server/app.js'));
  const hash = bcrypt.hashSync('AdminPassword123!', 10);
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Notification Admin', 'admin-notify@test.local', hash, 'admin');
  const login = await request(app).post('/api/auth/login').send({ email: 'admin-notify@test.local', password: 'AdminPassword123!' });
  assert.equal(login.status, 200);
  adminCookie = login.headers['set-cookie'];
});

after(() => {
  db.close();
  try { fs.unlinkSync(dbFile); } catch {}
});

test('notification test endpoint reports missing SMTP configuration', async () => {
  const response = await request(app).post('/api/notifications/test').set('Cookie', adminCookie).send({ to: 'parent@example.com', message: 'Discipline update' });
  assert.equal(response.status, 503);
  assert.equal(response.body.code, 'SMTP_NOT_CONFIGURED');
});

test('notification validation rejects malformed email', async () => {
  const response = await request(app).post('/api/notifications/test').set('Cookie', adminCookie).send({ to: 'not-an-email', message: 'Discipline update' });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});
