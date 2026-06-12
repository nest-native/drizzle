---
title: Why Native
description: How @nest-native/drizzle differs from raw providers, thin connection modules, and heavier ORM abstractions.
---

# Why Native

Drizzle already gives TypeScript applications a strong SQL-first database
toolkit. Nest applications need a second thing: a predictable integration with
modules, providers, lifecycle hooks, test overrides, enhancers, and transaction
boundaries.

`@nest-native/drizzle` exists for that Nest-facing layer. It should make Drizzle
feel at home in a Nest codebase without turning Drizzle into a different ORM.

## The Problem It Solves

Many Nest applications start with a custom provider:

```ts
export const DB = Symbol('DB');

@Module({
  providers: [
    {
      provide: DB,
      useFactory: () => drizzle(pool, { schema }),
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
```

That is a perfectly good starting point. Over time, larger applications usually
need the same surrounding pieces:

- A standard token for default and named clients.
- A place to keep schema metadata available through Nest DI.
- Feature-module repository registration.
- Test modules and mocks that use production tokens.
- Shutdown hooks for driver-owned pools and clients.
- A transaction decorator story that fits service methods.
- Documentation for how validation, Swagger, drivers, and samples fit together.

This package turns those repeated Nest integration chores into a small public
API while leaving schemas and queries in ordinary Drizzle.

## Comparison

| Approach | Good fit | Tradeoff |
| --- | --- | --- |
| Raw Nest providers | Small apps, prototypes, one database client | Every project invents tokens, cleanup, tests, and multi-client conventions |
| Thin connection modules | Apps that only need `provide: db` | Usually stop before repositories, testing utilities, transactions, and lifecycle guidance |
| Heavy ORM-style wrappers | Teams that want entities and abstraction over SQL | Can hide Drizzle's explicit query model and make advanced SQL awkward |
| `@nest-native/drizzle` | Nest apps that want Drizzle plus Nest modules, DI, repositories, testing, and transaction decorators | Adds a small Nest-facing API that applications should learn |

The package does not compete with Drizzle. Drizzle remains the database layer.
This package is the Nest integration layer around it.

## What Stays Drizzle

These stay in application code:

- Table definitions with standard Drizzle functions.
- Query builders and the `sql` template.
- Migrations and Drizzle Kit configuration.
- Driver selection and driver-specific options.
- Pool sizing, TLS, timeouts, and deployment-specific behavior.

You should still recognize every database query as Drizzle code.

## What Becomes Nest-Native

These become package-supported Nest patterns:

- `DrizzleModule.forRoot()` and `forRootAsync()` for root registration.
- `@InjectDrizzle()` for direct client injection.
- `@DrizzleRepository()` plus `DrizzleModule.forFeature()` for query providers.
- Named connections for multi-database applications.
- Shutdown hooks connected to the Nest lifecycle.
- `DrizzleTestModule` and mock helpers for tests.
- `@Transactional()` and `@InjectTransaction()` bridges to the CLS transaction
  stack.

The goal is not to remove direct Drizzle access. The goal is to make direct
Drizzle access fit cleanly inside Nest.

## When Raw Providers Are Enough

Stay with raw providers when:

- The app has one database client and very little query code.
- No shared repository or feature module boundary exists yet.
- Shutdown behavior is already handled elsewhere.
- The team does not need package-level testing helpers or named connections.

You can adopt this package later. The [Adoption Guide](adoption-guide.md) shows
how to move one provider or feature module at a time.

## When This Package Helps

Use this package when:

- Multiple services need the same Drizzle client through Nest DI.
- Query code is large enough to deserve repository providers.
- Tests should override the same tokens production code uses.
- A Nest module should own driver cleanup.
- A workflow needs CLS-backed `@Transactional()` service methods.
- The project needs a documented pattern for validation, Swagger, drivers,
  samples, and release checks.

These are integration concerns, not query-building concerns. That boundary is
the reason the package can stay small.

## Performance Posture

`@nest-native/drizzle` does not translate queries. Repository methods call the
Drizzle client directly, and raw SQL escape hatches remain available through
Drizzle.

For hot paths, measure:

- Database query plans.
- Driver and pool behavior.
- Network latency.
- Transaction scope.
- Validation work at the HTTP boundary.

The package layer is Nest provider wiring. It should not be the interesting
part of a database performance profile.

## Validation Boundary

The canonical Nest HTTP path is still DTO classes, `ValidationPipe`, and
`@nestjs/swagger`.

`drizzle-zod` is supported as an optional application-owned pattern when a team
chooses schema-derived validation. The package does not expose a root Zod API or
make Zod a default dependency. See
[Zod + Swagger/OpenAPI Bridge](samples/zod-openapi-bridge.md)
for the supported bridge pattern.

## Security Boundary

This package should not make unsafe database access easier. Keep these rules in
reviews:

- Never build SQL by concatenating request strings.
- Keep secrets, password hashes, and internal metadata out of DTOs, logs, docs,
  and sample payloads.
- Keep tenant selection and authorization explicit in application services.
- Keep transaction boundaries scoped to the service method that owns the unit of
  work.
- Keep optional validation and driver ecosystems app-owned unless the package
  truly requires them.
