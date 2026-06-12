# Sample 15: PostgreSQL Driver Setup

This sample shows a PostgreSQL `pg` pool registered through
`DrizzleModule.forRoot()`.

It is intentionally driver-owned: application code creates the pool, wraps it
with Drizzle, passes the ready Drizzle database to the module, and closes the
pool through the module shutdown hook.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| PostgreSQL pool construction | `src/database.ts` |
| Driver-specific shutdown hook | `src/app.module.ts` |
| Node PostgreSQL Drizzle client injection | `src/events/events.repository.ts` |
| Async Drizzle reads and writes | `src/events/events.repository.ts` |
| Optional real HTTP smoke test | `scripts/smoke.ts` |

## Run

```bash
NEST_DRIZZLE_NATIVE_POSTGRES_URL=postgresql://drizzle:drizzle@127.0.0.1:5432/drizzle \
  npm run start --workspace nest-drizzle-native-sample-15-postgres-driver
```

## Validate

```bash
npm run test --workspace nest-drizzle-native-sample-15-postgres-driver
```

The smoke test skips when `NEST_DRIZZLE_NATIVE_POSTGRES_URL` is not set, so the
sample remains friendly for local machines without PostgreSQL. CI provides a
PostgreSQL service and runs the real round trip.

## Why This Matters

PostgreSQL applications usually own a pool, not a single file-backed handle.
`@nest-native/drizzle` should not hide that. The package only needs the Drizzle
database object and a cleanup callback; connection pooling stays explicit in
application code.

Use this sample when your app uses `pg` and `drizzle-orm/node-postgres`.

## Post-Sample Review

- Library ergonomics: no package change needed. `connection` and `shutdown`
  cover pool ownership without a driver-specific module API.
- Architecture: keep PostgreSQL pool configuration in application code, close it
  through `shutdown`, and inject the typed Drizzle database in repositories.
- Documentation: this adds the PostgreSQL driver-specific focused sample while
  keeping local execution optional.
- Performance: no package performance concern found. Pooling remains controlled
  by the `pg` driver configuration.
- Maintainability: service-backed driver samples should skip locally unless the
  required URL is configured, while CI should provide the service to keep the
  sample honest.
