# Sample 13: Optional Drizzle-Zod + OpenAPI Bridge

This sample shows an optional path for teams that already want `drizzle-zod` in
their application code. It is not the default validation story for the library.

For the most Nest-native HTTP API shape, prefer DTO classes with
`ValidationPipe`, as shown in `sample/08-validation-class-validator`, and
document those DTOs with `@nestjs/swagger`, as shown in
`sample/12-swagger-openapi`.

When a project deliberately chooses schema-derived validation, this sample
combines the two paths:

- `drizzle-zod` owns runtime request validation at the route boundary.
- Explicit Swagger DTO classes own the public OpenAPI contract.

The point is not to hide either tool. It is to show a small, understandable
bridge where the database schema, runtime validation, API docs, and smoke tests
stay aligned without adding package-level magic.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Drizzle table as source of truth | `src/schema.ts` |
| `drizzle-zod` insert schema generation | `src/tickets/ticket.validation.ts` |
| Nest route validation with a Zod pipe | `src/zod-validation.pipe.ts`, `src/tickets/tickets.controller.ts` |
| Swagger request and response DTOs | `src/tickets/create-ticket.dto.ts`, `src/tickets/ticket.dto.ts` |
| OpenAPI generation and contract assertions | `src/openapi.ts`, `scripts/smoke.ts` |
| Invalid payload rejection before writes | `scripts/smoke.ts` |
| Valid payload persistence with real Drizzle queries | `src/tickets/tickets.repository.ts` |

## Run

```bash
npm run start --workspace nest-drizzle-native-sample-13-zod-openapi-bridge
```

## Validate

```bash
npm run test --workspace nest-drizzle-native-sample-13-zod-openapi-bridge
```

## Why This Matters

The superpower here is a pragmatic optional contract split:

- Drizzle schema stays the database source of truth.
- Zod schema stays the runtime validation source of truth for this optional
  flow.
- Swagger DTOs stay normal Nest classes for API documentation.
- Smoke tests verify that the documented required fields match the Zod input
  keys.

Use this when your API shape tracks the insert schema closely but your team also
wants generated OpenAPI docs. Keep separate DTOs or custom schemas when the
public API intentionally differs from database columns.

## Post-Sample Review

- Library ergonomics: no package change needed. Validation belongs naturally in
  Nest pipes, and Swagger DTOs remain easy to inspect. A package helper would be
  premature until more samples prove repeated boilerplate.
- Architecture: `drizzle-zod` works best as a schema-derived validation layer,
  while explicit DTOs keep the OpenAPI boundary readable for Nest users. This
  remains an opt-in pattern; class-validator DTOs are still the canonical
  Nest-native HTTP validation path.
- Documentation: present this as an optional bridge for teams that want both
  schema-derived validation and Swagger docs, not as the default project
  direction.
- Performance: no package performance concern found. Validation runs once at
  the route boundary before database work, and OpenAPI generation is bootstrap
  work only.
- Maintainability: the repeated local `ZodValidationPipe` is still acceptable.
  If more samples need the same bridge, consider a sample helper first and a
  public package helper only after that pattern proves stable.
