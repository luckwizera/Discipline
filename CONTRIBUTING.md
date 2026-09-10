# Contributing to Discipline Track

## Development workflow

1. Create a focused branch for one feature or fix.
2. Keep changes small and reviewable.
3. Add or update tests for behavior changes.
4. Run the full local quality gate before opening a pull request:

   ```bash
   npm ci
   npm audit --audit-level=high
   npm run lint
   npm test
   npm run build
   ```

5. Update API/OpenAPI documentation when contracts change.
6. Update the changelog for user-visible changes.
7. Do not commit generated databases, credentials, or other local state.

## Commit guidance

Use focused Conventional Commit-style messages, for example:

- `feat: add permission approval workflow`
- `fix: reject invalid conduct amounts`
- `test: cover student authorization`
- `docs: clarify deployment requirements`
- `chore: refresh dependencies`

Avoid bundling unrelated features, formatting-only changes, and dependency upgrades into one commit.

## Pull requests

Pull requests should explain the problem, summarize the implementation, describe test coverage, and call out security or data-model implications. Keep the diff focused so reviewers can verify behavior efficiently.

CI validates dependency security, linting, tests with the repository coverage threshold, and the production build. Dependency review and CodeQL provide additional automated checks.

## Privacy and security

Never commit real student, parent, staff, or school credentials. Use synthetic fixtures and local environment variables. Treat student records as sensitive data and follow the repository security policy and applicable school privacy requirements.
