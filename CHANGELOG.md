# Changelog

## 1.2.0

- Renamed the product and documentation from E-Card to Discipline.
- Updated the package metadata to `discipline-school-management`.
- Updated frontend metadata, title, and visible branding.
- Renamed the default SQLite path and Docker service/volume to Discipline names.
- Updated README, backend documentation, architecture documentation, API guide, and OpenAPI metadata.
- Preserved the existing `ecard` authentication cookie name for deployment compatibility.

## 1.1.0

- Added modular Express backend architecture.
- Added Zod request validation.
- Added structured JSON logging and `/api/health`.
- Added API integration tests for authentication, conduct marks, permissions, and reports.
- Added GitHub Actions CI and Dependabot configuration.
- Added Docker and Compose deployment files.
- Added secure administrator provisioning command.
- Added production authentication overlay to the frontend.
- Added architecture, API, OpenAPI, security, and contribution documentation.
- Removed the insecure JWT fallback secret.
