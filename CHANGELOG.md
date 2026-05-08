# Changelog

All notable user-facing changes to `nest-drizzle-native` are tracked here.

This project follows semantic versioning for the published package. Sample,
documentation, and CI-only changes may remain in `Unreleased` until the next
package release is useful for users.

## Unreleased

### Added

- Focused samples for the Drizzle-Zod/OpenAPI bridge, better-sqlite3,
  PostgreSQL, and MySQL driver setup.
- A release guide covering version sync, release checks, publishing, tagging,
  and post-publish verification.
- Focused sample discovery through `npm run sample:focused`.

### Changed

- Clarified that DTO classes with `ValidationPipe` are the default Nest-native
  HTTP validation path, while Zod and `drizzle-zod` remain optional and
  app-owned.
- Documented that driver-specific samples should own driver pools/clients in
  application code and pass ready Drizzle clients into `DrizzleModule`.

### Security

- Updated the docs website lockfile to pick up the audited
  `@babel/plugin-transform-modules-systemjs` patch release.

## 0.1.0 - 2026-05-05

### Added

- Initial public package release.
- `DrizzleModule.forRoot()`, `forRootAsync()`, and `forFeature()`.
- `@InjectDrizzle()` and `@DrizzleRepository()`.
- Transaction decorator bridges for `@nestjs-cls/transactional`.
- Named connection tokens and provider registration helpers.
- Optional database error mapping helpers.
- `DrizzleTestModule` and mock helpers for unit tests.
- CI gates for build, typecheck, coverage, cognitive complexity, package
  validation, sample validation, and supply-chain audit.
