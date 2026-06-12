# Sample 04: Named Connections

This sample shows how one NestJS app can use multiple Drizzle clients without
mixing their schemas or queries.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Default Drizzle connection | `src/app.module.ts` |
| Named `analytics` connection | `src/app.module.ts` |
| `@InjectDrizzle()` for default DB | `src/products/products.repository.ts` |
| `@InjectDrizzle('analytics')` for named DB | `src/analytics/analytics.repository.ts` |
| `@DrizzleRepository('analytics')` metadata | `src/analytics/analytics.repository.ts` |
| Feature module repository registration | `src/products/products.module.ts` |
| Isolation smoke test | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-04-named-connections
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-04-named-connections
```

## Why This Matters

The superpower here is explicit multi-database wiring with stable Nest tokens.
Products use the default connection, while analytics events use the named
`analytics` connection. If a repository accidentally injects the wrong client,
the sample fails because the expected table only exists in the intended
database.

## Post-Sample Review

- Library ergonomics: no package change needed. `@InjectDrizzle('name')` is
  direct and readable for named clients.
- Architecture: each repository should inject the connection it owns. Keep the
  root module responsible for creating each client.
- Documentation: production multi-tenant guidance links this sample as the
  baseline for a small, known set of databases.
- Performance: no package performance concern found. Each connection is created
  once and closed through its own shutdown hook.
- Maintainability: keeping schemas split by connection makes the sample easier
  to inspect than one shared schema object.
