# Sample 17: drizzle-kit Migrations

This sample shows the production migration boundary: Drizzle owns schema and
migration files, while `nest-drizzle-native` owns Nest module registration,
repository injection, and shutdown wiring.

The library does not wrap `drizzle-kit`. Applications keep migration generation
and migration execution explicit so deploy workflows remain driver-aware and
database-safe.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Standard `drizzle-kit` config | `drizzle.config.ts` |
| App-owned generated migrations | `drizzle/` |
| Migration execution before Nest repositories run | `src/database.ts` |
| Injected repositories after migration setup | `src/projects/projects.repository.ts` |
| HTTP smoke test against a migrated local database | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-drizzle-native-sample-17-drizzle-kit-migrations
```

## Validate

```bash
npm run test --workspace nest-drizzle-native-sample-17-drizzle-kit-migrations
```

## Regenerate Migrations

After changing `src/schema.ts`, regenerate migrations with:

```bash
npm run db:generate --workspace nest-drizzle-native-sample-17-drizzle-kit-migrations
```

Commit the generated SQL and metadata. In real deployments, apply migrations as
a release step before serving traffic, or during controlled startup only when
your platform guarantees a single migration runner. See the production
[Migration Operations](https://nest-native.dev/nest-drizzle-native/docs/migration-operations)
guide for multi-replica safety, backfills, and readiness guidance.

## Why This Matters

Migrations are operational state, not Nest provider metadata. Keeping them
app-owned preserves Drizzle's SQL-first workflow and avoids a package-level
abstraction that would hide driver-specific deploy decisions.

Use this sample when you want a minimal pattern for:

- schema changes through standard Drizzle table definitions
- generated SQL committed with the application
- migration execution before Nest controllers and repositories handle requests
- local CI validation without external database services

## Post-Sample Review

- Library ergonomics: no package API change needed. Migration generation and
  execution belong to Drizzle and application deploy workflows.
- Architecture: migrations should run before request handling. The module should
  receive an already migrated client, or the app should run migrations during a
  controlled bootstrap phase.
- Documentation: production docs should mention migration ownership explicitly
  so users do not expect a hidden Nest migration runner.
- Performance: startup migration checks are fine for local samples. Production
  deployments should avoid concurrent migration runners across replicas.
- Maintainability: future driver-specific migration samples can reuse this
  shape while swapping the Drizzle driver and migration runner.
