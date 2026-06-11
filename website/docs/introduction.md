# Introduction

`@nest-native/drizzle` is a NestJS integration for Drizzle ORM. It is designed
for applications that want Drizzle's SQL-first model with the NestJS module,
provider, lifecycle, and testing patterns they already use.

The library does not replace Drizzle schema definitions, query builders,
migrations, SQL templates, or driver packages. Your application still owns those
choices. This package supplies the Nest-facing integration layer:

- `DrizzleModule.forRoot()` and `DrizzleModule.forRootAsync()` for connection registration.
- `@InjectDrizzle()` for direct Drizzle client injection.
- `@DrizzleRepository()` with `DrizzleModule.forFeature()` for repository classes.
- Named connections for multi-database applications.
- Shutdown hooks for drivers created by the module.
- Transaction decorator bridges for `@nestjs-cls/transactional`.
- Testing helpers for focused Nest module tests.

## Design Goals

The package should feel native in NestJS projects and faithful to Drizzle:

- Nest owns dependency injection, module boundaries, and lifecycle cleanup.
- Drizzle owns schema definitions, query construction, and database-specific SQL.
- Repositories are plain Nest providers, not a new ORM abstraction.
- Optional integrations stay optional. Drivers, Swagger, Drizzle-Zod, and CLS
  transactions are peer capabilities, not runtime dependencies pulled into every app.

## When To Use It

Use this package when your Nest application needs a structured Drizzle setup:

- You want to inject one or more Drizzle clients through Nest DI.
- You want query code grouped in provider classes that can be tested and reused.
- You need a central module to own driver cleanup.
- You use `@nestjs-cls/transactional` and want project-local transaction decorators.
- You want testing helpers that preserve the same DI tokens as production setup.

For the design tradeoffs, see [Why Native](why-native.md). For the first
runnable setup, continue with [Quick Start](quick-start.md).
