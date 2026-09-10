# Discipline Track backend

The backend provides authenticated school administration and student APIs, SQLite persistence, conduct history, permission-card workflows, PDF report generation, and optional SMTP parent notifications.

## Run

1. Install Node.js 20+.
2. Run `npm ci`.
3. Copy `.env.example` to `.env` and set a strong `JWT_SECRET`.
4. Run `npm start`.

## Production requirements

- Use a unique production JWT secret with at least 32 characters.
- Configure a durable SQLite volume or move to a managed relational database for larger deployments.
- Configure HTTPS at the reverse proxy.
- Configure SMTP credentials for parent notifications when email delivery is enabled.
- Create administrator and student users using the deployment's secure provisioning process.
- Restrict access to student records according to school policy and applicable privacy requirements.
- Monitor `GET /api/health` and protected `GET /api/metrics`.
- Back up the database regularly.

## Main modules

- `app.js` — middleware, security headers, metrics, and route composition
- `auth.js` — JWT authentication and role checks
- `db.js` — SQLite schema and persistence
- `validation.js` — request validation
- `routes/` — feature-specific API routes
- `logger.js` — structured request/error logging
