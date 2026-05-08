# Superpowers

The library is small on purpose. Its strengths come from fitting into Nest
without hiding Drizzle.

## Full Showcase

`00-showcase` combines the complete first-version story: feature modules,
repositories, services, controllers, request-scoped providers, guards,
interceptors, pipes, filters, CLS transactions, `@InjectTransaction()`,
class-validator DTOs, optional Drizzle-Zod validation, Swagger, Express smoke
coverage, and a Fastify bootstrap file.

Inspect:

- [`00-showcase/src/app.module.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/00-showcase/src/app.module.ts)
- [`00-showcase/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/00-showcase/scripts/smoke.ts)

## Nest-Native Database Registration

`DrizzleModule.forRoot()` and `forRootAsync()` let applications register Drizzle
clients through normal Nest modules.

Inspect:

- [`01-basic-client-injection/src/app.module.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/01-basic-client-injection/src/app.module.ts)
- [`03-for-root-async/src/app.module.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/03-for-root-async/src/app.module.ts)

## Explicit Drizzle Queries

Schemas and queries remain Drizzle-native. There are no hidden entities or query
translation layers.

Inspect:

- [`01-basic-client-injection/src/schema.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/01-basic-client-injection/src/schema.ts)
- [`02-repositories/src/notes/notes.repository.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/02-repositories/src/notes/notes.repository.ts)

## Repository Providers Without Active Record Magic

`@DrizzleRepository()` marks repository classes while keeping them regular Nest
providers. `DrizzleModule.forFeature()` handles feature-module registration.

Inspect:

- [`02-repositories/src/notes/notes.module.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/02-repositories/src/notes/notes.module.ts)
- [`02-repositories/src/notes/notes.repository.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/02-repositories/src/notes/notes.repository.ts)

## Multiple Connections

Named connections let one Nest app inject separate Drizzle clients without
manual token plumbing in application code.

Inspect:

- [`04-named-connections/src/app.module.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/04-named-connections/src/app.module.ts)
- [`04-named-connections/src/products/products.service.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/04-named-connections/src/products/products.service.ts)

## Driver-Owned Lifecycle

Applications own driver construction. `DrizzleModule.forRoot()` receives the
ready Drizzle client and an explicit shutdown callback for the underlying driver
handle.

Inspect:

- [`14-better-sqlite3-driver/src/database.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/14-better-sqlite3-driver/src/database.ts)
- [`14-better-sqlite3-driver/src/app.module.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/14-better-sqlite3-driver/src/app.module.ts)
- [`15-postgres-driver/src/database.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/15-postgres-driver/src/database.ts)
- [`15-postgres-driver/src/app.module.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/15-postgres-driver/src/app.module.ts)

## Transaction Decorators

`@Transactional()` bridges to the CLS transaction stack so workflow services can
coordinate commits and rollbacks across injected providers.

Inspect:

- [`05-transactions-cls/src/transfers/transfers.service.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/05-transactions-cls/src/transfers/transfers.service.ts)
- [`05-transactions-cls/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/05-transactions-cls/scripts/smoke.ts)

## Transaction Escape Hatch

`@InjectTransaction()` gives low-level providers direct access to the active
transaction object when query composition really needs it.

Inspect:

- [`06-manual-transaction/src/inventory/inventory.repository.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/06-manual-transaction/src/inventory/inventory.repository.ts)
- [`06-manual-transaction/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/06-manual-transaction/scripts/smoke.ts)

## Classic Nest DTO Validation

`ValidationPipe` and `class-validator` are the canonical Nest-native validation
path when the HTTP contract should be modeled as DTO classes.

Inspect:

- [`08-validation-class-validator/src/customers/create-customer.dto.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/08-validation-class-validator/src/customers/create-customer.dto.ts)
- [`08-validation-class-validator/src/app.module.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/08-validation-class-validator/src/app.module.ts)

## Optional Schema-Derived Validation

`drizzle-zod` can derive request validation from Drizzle table schemas when an
application wants that style. It remains optional and app-owned rather than a
required library dependency or default Nest validation path.

Inspect:

- [`07-validation-drizzle-zod/src/tickets/ticket.validation.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/07-validation-drizzle-zod/src/tickets/ticket.validation.ts)
- [`07-validation-drizzle-zod/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/07-validation-drizzle-zod/scripts/smoke.ts)

## OpenAPI Contracts

`@nestjs/swagger` can document DTO-backed controllers while repositories keep
Drizzle persistence explicit and type-safe behind the HTTP boundary.

Inspect:

- [`12-swagger-openapi/src/projects/projects.controller.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/12-swagger-openapi/src/projects/projects.controller.ts)
- [`12-swagger-openapi/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/12-swagger-openapi/scripts/smoke.ts)

## Optional Zod Validation With OpenAPI Docs

`drizzle-zod` can validate incoming bodies while explicit Swagger DTOs document
the public contract. The bridge stays app-owned: Zod rejects bad input, DTOs
describe the route, and smoke tests assert the two stay aligned. Use this when
your application has already chosen schema-derived validation; otherwise, start
with DTOs and `ValidationPipe`.

Inspect:

- [`13-zod-openapi-bridge/src/tickets/tickets.controller.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/13-zod-openapi-bridge/src/tickets/tickets.controller.ts)
- [`13-zod-openapi-bridge/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/13-zod-openapi-bridge/scripts/smoke.ts)

## Opt-In Error Mapping

`mapDrizzleError()` lets applications translate known database constraint
failures into Nest exceptions where persistence meets application semantics.

Inspect:

- [`09-error-mapping/src/members/members.repository.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/09-error-mapping/src/members/members.repository.ts)
- [`09-error-mapping/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/09-error-mapping/scripts/smoke.ts)

## Honest Testing Utilities

`DrizzleTestModule` registers test clients under production tokens, while the
mock helpers stay intentionally shallow.

Inspect:

- [`10-testing-utilities/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/10-testing-utilities/scripts/smoke.ts)
- [`10-testing-utilities/src/tasks/tasks.repository.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/10-testing-utilities/src/tasks/tasks.repository.ts)

## Safe Raw SQL

Drizzle's `sql` template remains available for advanced reporting and
vendor-specific query shapes, with values parameterized through Drizzle instead
of string concatenation.

Inspect:

- [`11-raw-sql-escape-hatch/src/reports/reports.repository.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/11-raw-sql-escape-hatch/src/reports/reports.repository.ts)
- [`11-raw-sql-escape-hatch/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/11-raw-sql-escape-hatch/scripts/smoke.ts)
