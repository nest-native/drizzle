---
title: Zod Helper Evaluation
description: Why the Zod bridge stays app-owned for now, and what would justify a future helper.
---

# Zod Helper Evaluation

`nest-drizzle-native` does not expose a `nest-drizzle-native/zod` helper today.
That is intentional.

The default Nest-native HTTP contract remains DTO classes, `ValidationPipe`, and
`@nestjs/swagger`. Zod and `drizzle-zod` are useful opt-in application choices,
but they should not become the package's default validation personality.

## Current Decision

Keep the Zod + Swagger/OpenAPI bridge app-owned for now.

The focused bridge sample already shows the smallest useful pattern:

- `drizzle-zod` derives runtime validation from the Drizzle table.
- A local Nest pipe runs validation at the route boundary.
- Explicit Swagger DTO classes describe the public OpenAPI contract.
- Smoke tests assert that the Zod input keys and documented DTO properties stay
  aligned.

That pattern is clear, testable, and keeps optional dependencies out of the
published package's runtime surface.

## Comparison

| Option | Benefit | Cost | Current fit |
| --- | --- | --- | --- |
| App-owned bridge | Keeps dependencies optional and behavior visible in the app | A small local pipe and explicit DTO duplication | Best fit today |
| Sample helper | Reduces repeated sample boilerplate without publishing API | Still needs clear ownership and examples | Worth considering if more Zod samples repeat the same pipe |
| Package helper | Could standardize validation or OpenAPI wiring | Expands public API, peer behavior, tests, docs, and failure modes | Too early today |

## Why Not Add A Package Helper Yet

A package helper would need to answer several hard questions:

- Does it validate only, or does it also affect Swagger/OpenAPI output?
- Does it depend on `zod`, `drizzle-zod`, `nestjs-zod`, or `@nestjs/swagger` at
  runtime?
- How does it fail when optional peers are missing?
- Does it make DTO classes feel second-class?
- Does it hide Drizzle and Zod primitives behind package-specific magic?
- Does it work across common Zod versions without brittle type coupling?

Those are real maintenance costs. Today, the local pipe is smaller than the
abstraction.

## Revisit Triggers

Reconsider a package helper only when all of these become true:

- More focused samples repeat the same app-owned Zod boilerplate.
- Application code needs more than a small local pipe to stay maintainable.
- The helper can remain fully optional from the published package's dependency
  perspective.
- The helper leaves DTO classes, `ValidationPipe`, and `@nestjs/swagger` as the
  canonical onboarding path.
- Tests can prove missing-peer behavior, validation failures, TypeScript
  compilation, and Swagger/OpenAPI output where relevant.

## Acceptable Next Step

If repetition grows, add a sample-local helper first. That lets the project test
the ergonomics without committing to a public export.

Only promote a helper into the package after a sample-first review proves that
the helper is smaller and clearer than the repeated application code.
