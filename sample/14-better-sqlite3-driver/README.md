# Sample 14: better-sqlite3 Driver Setup

This sample shows a local `better-sqlite3` connection registered through
`DrizzleModule.forRoot()`.

Unlike the libSQL samples, `better-sqlite3` owns a synchronous database handle.
The important Nest integration detail is keeping that handle in the module setup
and closing it through the Drizzle module shutdown hook.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| `better-sqlite3` driver construction | `src/database.ts` |
| Driver-specific shutdown hook | `src/app.module.ts` |
| Better SQLite Drizzle client injection | `src/events/events.repository.ts` |
| Synchronous Drizzle reads and writes | `src/events/events.repository.ts` |
| Real HTTP smoke test with a local database file | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-14-better-sqlite3-driver
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-14-better-sqlite3-driver
```

## Why This Matters

The library should not care which Drizzle driver your application owns. The app
constructs the driver-specific client, passes the Drizzle database object to
`DrizzleModule.forRoot()`, and keeps lifecycle cleanup explicit through
`shutdown`.

Use this sample when you want a SQLite setup that stays entirely local but does
not use the libSQL client.

## Post-Sample Review

- Library ergonomics: no package change needed. The existing `connection` and
  `shutdown` options handle synchronous driver ownership cleanly.
- Architecture: driver construction belongs in application code. The module
  should receive a ready Drizzle client and an explicit cleanup callback.
- Documentation: this fills the first driver-specific focused sample without
  requiring external services in CI.
- Performance: no package performance concern found. `better-sqlite3` uses
  synchronous calls, but the sample keeps work small and local.
- Maintainability: future driver samples should follow the same shape: isolate
  driver construction, prove injection, and document shutdown behavior.
