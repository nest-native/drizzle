# Sample 01: Basic Client Injection

This is the smallest runnable NestJS app that uses `@nest-native/drizzle` with a
real Drizzle database client.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| `DrizzleModule.forRoot()` | `src/app.module.ts` |
| Direct `@InjectDrizzle()` usage | `src/notes/notes.service.ts` |
| Standard Drizzle schema syntax | `src/schema.ts` |
| Real database queries | `src/notes/notes.service.ts` |
| HTTP route backed by Drizzle | `src/notes/notes.controller.ts` |
| Local smoke test | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-drizzle-native-sample-01-basic-client
```

## Validate

```bash
npm run test --workspace nest-drizzle-native-sample-01-basic-client
```

## Why This Matters

The superpower here is direct access to the Drizzle client through Nest
dependency injection. There is no custom entity layer and no hidden query API:
services can use the full Drizzle query builder while the connection lifecycle
stays inside a Nest module.

## Post-Sample Review

- Library ergonomics: no package change needed. The direct injection API is
  concise for services that genuinely need the full Drizzle surface.
- Architecture: this sample should stay intentionally small. Repository
  structure belongs in `sample/02-repositories`.
- Documentation: keep this sample linked from the quick start once the samples
  docs page exists.
- Performance: no library performance concern found. The smoke test boots one
  Nest app and uses a local libSQL database.
- Maintainability: the local database factory is duplicated by later samples; if
  more samples use the same setup, move that pattern into shared sample
  guidance, not the published package.
