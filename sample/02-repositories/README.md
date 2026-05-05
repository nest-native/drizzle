# Sample 02: Repositories

This sample shows how to use repository classes as Nest-native homes for Drizzle
queries.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| `@DrizzleRepository()` | `src/products/products.repository.ts` |
| `DrizzleModule.forFeature()` | `src/products/products.module.ts` |
| Constructor injection of repositories | `src/products/products.service.ts` |
| Standard Drizzle schema syntax | `src/schema.ts` |
| CRUD-style Drizzle queries | `src/products/products.repository.ts` |
| HTTP routes backed by a repository | `src/products/products.controller.ts` |
| Local smoke test | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-drizzle-native-sample-02-repositories
```

## Validate

```bash
npm run test --workspace nest-drizzle-native-sample-02-repositories
```

## Why This Matters

The superpower here is structure without hiding Drizzle. Repositories are plain
Nest providers that organize query code, while each method still uses the real
Drizzle query builder.

## Post-Sample Review

- Library ergonomics: no package change needed. `@DrizzleRepository()` plus
  `forFeature()` provides a natural Nest registration flow.
- Architecture: feature modules should own repositories and export services,
  while the root module owns the database connection.
- Documentation: repository docs should point to this sample as the canonical
  focused example.
- Performance: no library performance concern found. The repository adds no
  runtime abstraction beyond Nest DI.
- Maintainability: this sample repeats local database setup from sample 01. That
  should become shared sample guidance if a third sample repeats the pattern.
