# Pull Request Workflow

Use a focused branch for each change and open a pull request against `main`.

## Before opening a PR

- Keep the change focused.
- Add or update tests for behavior changes.
- Run `npm run lint`.
- Run `npm test`.
- Run `npm run build`.
- Keep secrets, `.env` files, and local SQLite databases out of commits.

## Commit conventions

Use Conventional Commit prefixes such as `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, and `chore:`. Prefer small commits that each represent one logical change.

## Merge standard

Merge only when CI is green and the PR description explains what changed and how it was tested.
