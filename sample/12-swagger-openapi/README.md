# Sample 12: Swagger And OpenAPI

This sample shows the current supported OpenAPI path: use normal NestJS DTOs
and `@nestjs/swagger` decorators for the HTTP contract, while repositories keep
the Drizzle-backed persistence code explicit.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Swagger document setup | `src/openapi.ts`, `src/main.ts` |
| DTO classes with OpenAPI metadata | `src/projects/create-project.dto.ts`, `src/projects/project.dto.ts` |
| Drizzle-backed documented routes | `src/projects/projects.controller.ts`, `src/projects/projects.repository.ts` |
| OpenAPI smoke verification | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-drizzle-native-sample-12-swagger-openapi
```

## Validate

```bash
npm run test --workspace nest-drizzle-native-sample-12-swagger-openapi
```

## Why This Matters

The superpower here is honest composition. The library keeps Drizzle clients and
repositories inside Nest's DI system, and `@nestjs/swagger` documents the
controller contract the same way it would in any Nest application.

This first version does not generate OpenAPI schemas directly from Drizzle
tables. If an application needs OpenAPI today, keep the HTTP DTOs explicit and
let repositories translate those DTOs into Drizzle writes and reads.

## Post-Sample Review

- Library ergonomics: no package change needed. Swagger works through normal
  Nest controllers and DTOs.
- Architecture: keep DTO/OpenAPI concerns at the HTTP boundary and keep Drizzle
  schema/query concerns inside repositories.
- Documentation: this sample should be the canonical OpenAPI reference until a
  future generated-schema helper is justified by repeated demand.
- Performance: no package performance concern found. OpenAPI generation reads
  Nest metadata and does not affect Drizzle runtime behavior.
- Maintainability: do not add Drizzle-to-OpenAPI helpers yet; prove the need in
  more samples or user requests first.
