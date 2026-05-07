# Superpowers

The library is small on purpose. Its strengths come from fitting into Nest
without hiding Drizzle.

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

## Schema-Derived Validation

`drizzle-zod` can derive request validation from Drizzle table schemas, keeping
database shape and runtime validation close together.

Inspect:

- [`07-validation-drizzle-zod/src/tickets/ticket.validation.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/07-validation-drizzle-zod/src/tickets/ticket.validation.ts)
- [`07-validation-drizzle-zod/scripts/smoke.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/07-validation-drizzle-zod/scripts/smoke.ts)

## Classic Nest DTO Validation

`ValidationPipe` and `class-validator` remain first-class options when the HTTP
contract should be modeled as DTO classes.

Inspect:

- [`08-validation-class-validator/src/customers/create-customer.dto.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/08-validation-class-validator/src/customers/create-customer.dto.ts)
- [`08-validation-class-validator/src/app.module.ts`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/08-validation-class-validator/src/app.module.ts)

## Still Planned

The sample plan also includes database error mapping, testing utilities, safe
raw SQL patterns, Swagger/OpenAPI integration, and the full showcase. Those
pages should stay honest until the runnable samples land.
