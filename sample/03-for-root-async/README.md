# Sample 03: Async Configuration And Shutdown

This sample shows production-style database setup with
`DrizzleModule.forRootAsync()`.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Async module configuration | `src/app.module.ts` |
| Injected config service | `src/config/database-config.service.ts` |
| Async Drizzle client factory | `src/config/database.factory.ts` |
| Shutdown hook for owned drivers | `src/app.module.ts`, `src/config/database-lifecycle.tracker.ts` |
| Direct client injection after async setup | `src/system/system.service.ts` |
| Smoke assertion for shutdown | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-03-for-root-async
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-03-for-root-async
```

## Why This Matters

The superpower here is moving database construction out of application feature
code. The app can inject configuration, build the Drizzle client asynchronously,
and still let Nest own lifecycle cleanup through the module shutdown hook.

## Post-Sample Review

- Library ergonomics: no package change needed. `forRootAsync()` is clear once
  the config provider owns database URL construction.
- Architecture: root modules should own driver construction and shutdown;
  feature modules should consume injected clients or repositories.
- Documentation: the sample catalog links this as the focused async
  configuration and shutdown example.
- Performance: no package performance concern found. The async factory runs once
  during app bootstrap.
- Maintainability: local libSQL setup is now repeated across three samples, so
  `sample/README.md` documents the convention. Keep it sample-local unless a
  real package use case appears.
