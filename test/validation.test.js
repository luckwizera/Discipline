import test from 'node:test';
import assert from 'node:assert/strict';
import { eventSchema, loginSchema, notificationSchema, permissionSchema, permissionStatusSchema, validate } from '../server/validation.js';

test('login schema accepts valid credentials and rejects invalid email', () => {
  assert.equal(loginSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success, true);
  assert.equal(loginSchema.safeParse({ email: 'not-an-email', password: 'password123' }).success, false);
});

test('event schema applies the notification default', () => {
  const result = eventSchema.safeParse({ studentId: 'ST-1', type: 'Appreciation', amount: 2, reason: 'Great work' });
  assert.equal(result.success, true);
  assert.equal(result.data.notifyParent, false);
  assert.equal(eventSchema.safeParse({ studentId: 'ST-1', type: 'Unknown', amount: 2, reason: 'Great work' }).success, false);
});

test('event schema enforces numeric and text boundaries', () => {
  assert.equal(eventSchema.safeParse({ studentId: '', type: 'Appreciation', amount: 2, reason: 'Good' }).success, false);
  assert.equal(eventSchema.safeParse({ studentId: 'ST-1', type: 'Appreciation', amount: 0, reason: 'Good' }).success, false);
  assert.equal(eventSchema.safeParse({ studentId: 'ST-1', type: 'Appreciation', amount: 2.5, reason: 'Good' }).success, false);
  assert.equal(eventSchema.safeParse({ studentId: 'ST-1', type: 'Appreciation', amount: 2, reason: 'x' }).success, false);
});

test('permission schemas validate dates and status values', () => {
  const valid = { studentId: 'ST-1', reason: 'Appointment', outTime: '2026-09-02T14:00:00.000Z', backTime: '2026-09-02T16:00:00.000Z' };
  assert.equal(permissionSchema.safeParse(valid).success, true);
  assert.equal(permissionSchema.safeParse({ ...valid, outTime: 'tomorrow' }).success, false);
  assert.equal(permissionStatusSchema.safeParse({ status: 'Approved' }).success, true);
  assert.equal(permissionStatusSchema.safeParse({ status: 'Pending' }).success, false);
});

test('notification schema enforces email and message limits', () => {
  assert.equal(notificationSchema.safeParse({ to: 'parent@example.com', message: 'Update' }).success, true);
  assert.equal(notificationSchema.safeParse({ to: 'bad-email', message: 'Update' }).success, false);
  assert.equal(notificationSchema.safeParse({ to: 'parent@example.com', message: '' }).success, false);
});

test('validate middleware returns structured validation errors', () => {
  const middleware = validate(loginSchema);
  let nextCalled = false;
  const response = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  middleware({ body: { email: 'bad', password: 'short' } }, response, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');

  const request = { body: { email: 'user@example.com', password: 'password123' } };
  middleware(request, response, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(request.body.email, 'user@example.com');
});
