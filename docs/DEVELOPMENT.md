# Development Guide

## Workflow

1. Create a focused branch from `main`.
2. Make the smallest useful change.
3. Add or update tests for behavior changes.
4. Run `npm run lint`, `npm test`, and `npm run build` locally.
5. Open a pull request and let CI verify the branch.
6. Merge only after CI is green.

## Commit conventions

Use Conventional Commit prefixes such as `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, and `chore:`. Keep commits small and describe one logical change.

## Quality gates

CI installs from the committed lockfile, runs a high-severity npm audit, lint, the test suite with a 70% line-coverage threshold, and a production build.

## Security

Never commit `.env` files, credentials, tokens, or local SQLite databases. Use `.env.example` as the configuration reference.
