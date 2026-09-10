# Discipline Track API

The Discipline Track API powers school conduct records, student history, permission cards, reporting, and parent-notification workflows.

All protected endpoints use the HTTP-only `ecard` authentication cookie created by login. The cookie name is retained for compatibility with existing deployments.

## Authentication

`POST /api/auth/login`

```json
{"email":"admin@example.com","password":"..."}
```

`POST /api/auth/logout` clears the authentication cookie. `GET /api/auth/me` returns the authenticated identity.

## Conduct

`POST /api/events` — administration only.

```json
{"studentId":"ST-1024","type":"Appreciation","amount":2,"reason":"Helpful teamwork","notifyParent":true}
```

Appreciation increases the balance; sanction decreases it but never below zero. Status is `Good` below 12, `Watch` from 12 through 17, and `Review` at 18 or above.

## Students

`GET /api/students` — administration only.

`GET /api/students/:id/history` — administration, or the matching student account.

## Permission cards

`POST /api/permissions` — administration only.

`GET /api/permissions` — administration sees all cards; a student sees only their own cards.

`PATCH /api/permissions/:code` — administration only, with `{ "status": "Approved" }` or `{ "status": "Rejected" }`.

## Reports

`GET /api/reports/monthly.pdf`, `/api/reports/termly.pdf`, or `/api/reports/annual.pdf` — administration only.

## Notifications

`POST /api/notifications/test` — administration only. Requires SMTP configuration.

## Health and metrics

`GET /api/health` is public and returns database connectivity status for monitoring.

`GET /api/metrics` is restricted to authenticated administrators and returns operational request counters and uptime. It does not expose student records.

## Contract

The machine-readable API definition is maintained in [`docs/openapi.yaml`](openapi.yaml).
