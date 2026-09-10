# Discipline Architecture

Discipline is split into a browser UI and an Express API. The API owns authentication, authorization, validation, persistence, reporting, and notification delivery.

## Boundaries

- `index.html`, `app.js`, `styles.css`, `enhancements.js`, `auth-ui.js`: browser experience.
- `server/app.js`: composition root and middleware.
- `server/db.js`: SQLite connection, schema, and demo seed.
- `server/auth.js`: JWT signing and role middleware.
- `server/validation.js`: Zod request schemas.
- `server/routes/*`: feature endpoints.
- `server/logger.js`: structured JSON logging.
- `test/*`: integration and domain tests.

## Data model

`students` stores current conduct balance and parent contact fields. `events` records each appreciation/sanction as an immutable historical event. `permissions` stores digital exit cards and their approval state. `users` maps authenticated accounts to roles and, for student accounts, a student ID.

## Security model

The browser receives an HTTP-only authentication cookie. Every protected API route verifies the signed token. Administration routes additionally require the `admin` role. Student history and permission queries are restricted to the authenticated student's ID. Request bodies are validated before database operations.

## Deployment

For a small school deployment, the included Docker image can run behind an HTTPS reverse proxy with `/data` persisted. For larger installations, move persistence to a managed relational database and use a dedicated secrets manager. SMTP credentials and JWT secrets must never be committed to Git.

## Operational requirements

Back up the database, monitor `/api/health`, rotate secrets according to school policy, retain audit records according to applicable requirements, and restrict administrator accounts using least privilege.
