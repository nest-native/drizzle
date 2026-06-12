# Sample 16: MySQL Driver Setup

This sample shows a MySQL `mysql2/promise` pool registered through
`DrizzleModule.forRoot()`.

It mirrors the PostgreSQL sample: application code owns the pool, wraps it with
Drizzle, passes the ready Drizzle database to the module, and closes the pool
through the module shutdown hook.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| MySQL pool construction | `src/database.ts` |
| Driver-specific shutdown hook | `src/app.module.ts` |
| MySQL Drizzle client injection | `src/events/events.repository.ts` |
| Async Drizzle reads and writes | `src/events/events.repository.ts` |
| Optional real HTTP smoke test | `scripts/smoke.ts` |

## Run

```bash
NEST_DRIZZLE_NATIVE_MYSQL_URL=mysql://drizzle:drizzle@127.0.0.1:3306/drizzle \
  npm run start --workspace nest-drizzle-native-sample-16-mysql-driver
```

## Validate

```bash
npm run test --workspace nest-drizzle-native-sample-16-mysql-driver
```

The smoke test skips when `NEST_DRIZZLE_NATIVE_MYSQL_URL` is not set, so the
sample remains friendly for local machines without MySQL. CI provides a MySQL
service and runs the real round trip.

## Why This Matters

MySQL applications usually own a pool, just like PostgreSQL applications do.
`@nest-native/drizzle` keeps that explicit: the package receives the Drizzle
database object and a cleanup callback, while driver-specific pooling stays in
application code.

Use this sample when your app uses `mysql2` and `drizzle-orm/mysql2`.

## Post-Sample Review

- Library ergonomics: no package change needed. The existing module contract
  covers MySQL pool ownership.
- Architecture: MySQL connection details belong in application code, and the
  module shutdown hook is enough to close the pool.
- Documentation: this completes the first pass of driver-specific samples across
  libSQL, better-sqlite3, PostgreSQL, and MySQL.
- Performance: no package performance concern found. Pool sizing and connection
  behavior remain controlled by the `mysql2` driver.
- Maintainability: service-backed samples should continue to skip locally unless
  their URL is configured, while CI should provide the service for real coverage.
