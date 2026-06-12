# Changelog

All notable user-facing changes to `@nest-native/drizzle` are tracked here.

This project follows semantic versioning for the published package. Sample,
documentation, and CI-only changes may remain in `Unreleased` until the next
package release is useful for users.

## Unreleased

No user-facing changes yet.

## 0.3.0 - 2026-06-11

### Changed

- Renamed the published npm package from `nest-drizzle-native` to the scoped
  `@nest-native/drizzle` as part of consolidating the `@nest-native` family.
  Install and import `@nest-native/drizzle`; the public API is unchanged. The
  old `nest-drizzle-native` package is deprecated on npm and no longer
  maintained.
- Updated samples, documentation, badges, and npm registry links to the new
  package name. The GitHub repository stays `nest-native/nest-drizzle-native`,
  so all repository URLs and metadata are intentionally unchanged.

## 0.2.1 - 2026-05-16

### Changed

- Updated package metadata and documentation links for the
  `nest-native/nest-drizzle-native` repository move.
- Improved discoverability for the optional Zod + Swagger/OpenAPI bridge sample
  without adding a package-level Zod API.

## 0.2.0 - 2026-05-12

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
- CI now runs package coverage on both Node.js 20 and Node.js 22.
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
