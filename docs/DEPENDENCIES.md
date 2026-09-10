# Dependency Maintenance

Discipline treats dependency maintenance as a routine part of project health.

## Automated updates

Dependabot is intended to check npm dependencies weekly and GitHub Actions dependencies monthly. Updates should be reviewed through pull requests and verified by CI before merging.

## Review checklist

Before merging a dependency update:

1. Confirm `package.json` and `package-lock.json` are updated together.
2. Review the dependency changelog and release notes for breaking changes.
3. Check dependency review for newly introduced vulnerabilities or unexpected dependency changes.
4. Run CI: install, audit, lint, tests with coverage, and build.
5. Avoid major-version upgrades unless compatibility has been tested explicitly.

## Local verification

```bash
npm ci
npm audit --audit-level=high
npm run lint
npm test
npm run build
```

A clean `npm audit` result is useful, but it does not replace review of dependency changes.
