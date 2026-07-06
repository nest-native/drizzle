# Changelog

All notable user-facing changes to `@nest-native/drizzle` are tracked here.

This project follows semantic versioning for the published package. Sample,
documentation, and CI-only changes may remain in `Unreleased` until the next
package release is useful for users.

## Unreleased

- Internal: simplified `normalizeDrizzleConnectionName` to
  `connectionName?.trim() || DEFAULT` — the previous explicit `.length > 0`
  check was an unreachable branch (a truthy trimmed string always has a
  positive length). Behavior-neutral; the existing connection-name tests cover
  every input class (undefined, empty, whitespace, named).
- Local full-mode verification and mutation testing (repo tooling; nothing
  ships in the package): `compose.yaml` + `npm run infra:up`/`infra:down`
  start disposable PostgreSQL/MySQL containers, `npm run test:full` runs the
  gated driver specs against them, and Stryker mutation testing is available
  via `npm run test:mutation` (incremental) / `test:mutation:full` with
  `STRYKER_MUTATE` scoping and `STRYKER_WITH_INFRA=1` for I/O-inclusive runs.
  All of it is opt-in and local-only — CI is unchanged and Docker-free. See
  the new "Local Full-Mode Verification" section in GUIDELINES_NEST_DRIZZLE.md.
- Drizzle ORM v1 note: the Drizzle-Zod integration is built into drizzle-orm
  on the v1 line (`drizzle-orm/zod`; zod is an optional peer there) — the
  standalone `drizzle-zod` package stays on 0.x. Support policy corrected and
  the v1 RC canary now smokes schema derivation + parsing through
  `drizzle-orm/zod` (the spec skips on 0.x, where the subpath does not exist).

## 0.4.0 - 2026-07-05

### Added

- Drizzle ORM v1 release-candidate support for the core surface: the
  `drizzle-orm` peer range is now `>=0.30.0 <2.0.0 || >=1.0.0-rc.1 <2.0.0`, so
  installing `drizzle-orm@rc` next to this package resolves without
  `--legacy-peer-deps` (plain semver ranges never match prereleases; the
  explicit RC comparator is required). The range already covers v1 GA.
- The v1 RC CI canary is now expected green: the full package suite — module
  wiring, DI, repositories, testing helpers, driver round-trips, and a real
  commit/rollback through the CLS transactional adapter — compiles and passes
  against `drizzle-orm@1.0.0-rc.4`.

### Changed

- Integration/driver specs use the unified `drizzle({ client })` init form and
  schema-agnostic database types, the only shapes shared by 0.x and v1 (v1
  removed the positional-client overloads and repurposed the database type
  generic for Relational Queries v2). Test-only change; the public API is
  untouched.
- Support policy documents exactly what v1 RC support covers, what remains
  upstream-gated (`@nestjs-cls/transactional-adapter-drizzle-orm` pins
  `drizzle-orm@^0` — see Papooch/nestjs-cls#599 — and `drizzle-zod` has no
  v1-compatible release), and the npm `overrides` recipe for the adapter path.

## 0.3.2 - 2026-06-13

### Changed

- Added a rename notice to the package README so the npm package page reflects
  the move from `nest-drizzle-native` to `@nest-native/drizzle`, with migration
  steps for users still on the old package.
- Bumped development dependencies (`@nestjs/common`, `@nestjs/core` to
  `^11.1.26`). No runtime, public API, or `peerDependencies` changes.

### Security

- Pinned development/build tooling via npm `overrides` (`esbuild` `^0.28.1`,
  `ws` `^8.21.0`, `qs` `^6.15.2`) to clear high- and moderate-severity
  advisories in transitive development dependencies. The published package has
  no runtime dependencies, so consumers are unaffected.

## 0.3.1 - 2026-06-12

### Changed

- Renamed the GitHub repository from `nest-native/nest-drizzle-native` to
  `nest-native/drizzle` to match the npm package name. Stars, forks, issues,
  and history are preserved, and the old repository URL redirects.
- Updated all repository, homepage, bugs, badge, and documentation links to
  the new repository and the new docs path (`nest-native.dev/drizzle/`).

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
