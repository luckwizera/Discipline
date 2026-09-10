# Discipline Track — School Conduct & Permission Management

**Discipline Track** is a school operations application for recording student appreciation and sanction marks, maintaining transparent conduct history, notifying parents, issuing campus-exit permission cards, and generating periodic reports.

> A practical, auditable starting point for schools that want one place to manage student conduct workflows and permission requests.

## Highlights

- Administration dashboard for student monitoring and conduct management
- Student portal for personal conduct history and permission cards
- Appreciation and sanction workflows with validation
- Parent-notification integration through SMTP
- Digital permission cards with approval/rejection workflow
- Monthly, termly, and annual PDF reports
- Persistent SQLite backend with demo data for an empty database
- JWT-based role authentication with an HTTP-only cookie
- Role-based access control for administration and student records
- Zod request validation at the API boundary
- Structured API request/error logging and protected operational metrics
- Health endpoint for deployment monitoring
- Baseline browser security headers and API no-store caching policy
- Docker support for repeatable deployment

## Architecture

```text
Browser UI
  ├── Login
  ├── Administration dashboard
  └── Student portal
          │
          ▼
     Express API
     ├── Authentication / RBAC
     ├── Validation
     ├── Student routes
     ├── Conduct routes
     ├── Permission routes
     ├── Report routes
     └── Notification routes
          │
          ▼
       SQLite DB
          ├── Users
          ├── Students
          ├── Conduct events
          └── Permissions

External services: SMTP for parent email; PDFKit for reports.
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for system boundaries and deployment guidance.

## Requirements

- Node.js 20+
- npm

Use the repository's `.nvmrc` to select the tested Node.js major version.

## Installation

Use the committed lockfile for a reproducible setup:

```bash
npm ci
cp .env.example .env
```

Set a unique random `JWT_SECRET` of at least 32 characters before starting the server.

## Create the first administrator

```bash
npm run create-admin
```

The command prompts for the administrator's name, email, and password. Passwords are hashed with bcrypt and credentials are not written to source control.

## Run locally

Start the production-style Express server:

```bash
npm start
```

The default port is `3000`. Open the application through the Express server when using production authentication.

For frontend development with Vite:

```bash
npm run dev
```

## Quality checks

Run the same checks used by CI before opening a pull request:

```bash
npm ci
npm audit --audit-level=high
npm run lint
npm test
npm run build
```

The test command enforces a minimum **70% server-side line coverage**. GitHub Actions also runs dependency review and CodeQL on the appropriate changes.

## Environment variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Runtime environment; enables secure cookies in production |
| `PORT` | HTTP server port |
| `JWT_SECRET` | Required signing secret; minimum 32 characters |
| `DB_FILE` | SQLite database file path |
| `APP_ORIGIN` | Required in production and used as the CORS origin |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | Whether SMTP uses TLS directly |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Verified sender address |

Never commit `.env` or real school credentials.

## API overview

See [`docs/API.md`](docs/API.md) for request contracts and authorization rules.

- `POST /api/auth/login` — sign in
- `POST /api/auth/logout` — sign out
- `GET /api/auth/me` — current user
- `GET /api/health` — health and database check
- `GET /api/students` — administration student list
- `GET /api/students/:id/history` — authorized conduct history
- `POST /api/events` — record appreciation or sanction
- `GET /api/permissions` — authorized permission cards
- `POST /api/permissions` — create a permission card
- `PATCH /api/permissions/:code` — approve or reject a card
- `GET /api/reports/:period.pdf` — monthly, termly, or annual PDF
- `POST /api/notifications/test` — test configured SMTP delivery
- `GET /api/metrics` — protected operational request metrics for administrators

The machine-readable contract is maintained in [`docs/openapi.yaml`](docs/openapi.yaml).

## Demo data

The backend seeds sample students only when the database is empty. The records use synthetic parent contact information. Real school data should be provisioned through approved operational processes.

## Security and privacy

Student records are sensitive. Production deployments should use HTTPS, strong secrets stored outside source control, least-privilege access, database backups, retention/deletion policies, audit monitoring, rate limiting at the edge, and school-approved privacy procedures.

The API sends baseline browser security headers and disables caching for API responses. See [`SECURITY.md`](SECURITY.md) for the security policy.

## Docker

```bash
docker compose up --build
```

Persist the `discipline-data` volume. Supply `.env` through the deployment environment and do not commit it.

## Project documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system boundaries and deployment model
- [`docs/API.md`](docs/API.md) — API behavior and authorization
- [`docs/openapi.yaml`](docs/openapi.yaml) — OpenAPI contract
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — development workflow
- [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md) — dependency maintenance
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution workflow
- [`SECURITY.md`](SECURITY.md) — vulnerability reporting and deployment expectations
- [`CHANGELOG.md`](CHANGELOG.md) — release history

## Project status

Discipline Track is actively structured for maintainable school operations software: reproducible installs, automated quality gates, security checks, integration tests, coverage enforcement, and deployment documentation are part of the repository workflow.
