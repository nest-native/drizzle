# Roadmap

The package stays intentionally small. Today it focuses on:

- `DrizzleModule` registration, including async options and named connections.
- `@InjectDrizzle()` and repository providers for Nest-friendly query classes.
- Transaction decorator bridges for applications that use CLS.
- Testing helpers for override-friendly unit tests.
- Quality gates for coverage, performance reporting, cognitive complexity,
  release checks, and security audits.
- Focused samples for validation, error mapping, transactions, Swagger, and
  driver-owned lifecycle setup.

## Boundaries

DTO classes with `ValidationPipe` are the canonical Nest-native HTTP validation
path. Zod and `drizzle-zod` are supported as optional application choices, but
they should not become required dependencies or the default documentation path.

The Drizzle-Zod/OpenAPI bridge stays app-owned: Nest pipes own runtime
validation, explicit Swagger DTOs own the public API contract, and smoke tests
keep the two aligned.

Driver clients, pools, and shutdown behavior stay in application code. The
module receives a ready Drizzle client and an optional shutdown hook, which keeps
driver-specific behavior explicit and easy to inspect.

## Next

- Add focused samples for new drivers or public features as they land, while
  keeping local execution friendly and CI coverage real.
- Consider tiny optional helpers only when repeated samples show clear
  application friction and the helper does not weaken the Nest-native API.
