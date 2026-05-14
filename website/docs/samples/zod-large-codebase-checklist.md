---
title: Zod Migration Checklist
description: A phased checklist for migrating large Nest applications to app-owned Drizzle-Zod validation.
---

# Zod Migration Checklist

Use this checklist for larger Nest applications that already have many
`drizzle-zod` schemas, DTO files, controllers, and OpenAPI consumers.

## Phase 0: Inventory

- Search for direct schema generation:

  ```bash
  rg "createSelectSchema|createInsertSchema|createUpdateSchema" apps libs packages
  ```

- Record each route, DTO file, Drizzle table, current Swagger decorator, and
  owning team.
- Mark public API endpoints as high risk.
- Generate and save the current OpenAPI JSON before code changes.
- Identify fields that must never appear in request or response bodies, such as
  password hashes, tokens, internal IDs, and audit metadata.

## Phase 1: Migration Shape

- Choose the app-owned bridge only for endpoints whose request shape tracks the
  Drizzle table closely.
- Keep class-validator DTOs where the HTTP contract is intentionally different
  from persistence.
- Put Zod schemas in named validation files near the feature module.
- Keep Swagger DTO classes explicit.
- Keep Drizzle queries in repositories or services; do not move persistence
  logic into DTO or validation files.

## Phase 2: First Endpoint

- Derive a strict insert or update schema with `drizzle-zod`.
- Omit database-owned fields such as `id`, `createdAt`, and `updatedAt`.
- Extend with route-level validation rules.
- Add a Nest pipe at the controller boundary.
- Add `@ApiBody`, response decorators, and error response decorators.
- Assert invalid input, valid persistence, and OpenAPI property alignment.

## Phase 3: Incremental Rollout

- Migrate one feature module at a time.
- Keep class names and response DTO names stable when API clients depend on
  generated OpenAPI names.
- Compare OpenAPI output after every public route migration.
- Avoid mixing route migration with repository rewrites, driver changes, or
  transaction changes.
- Keep the branch reversible: if an endpoint behaves differently, roll back
  that endpoint without touching the rest of the migration.

## Phase 4: Verification

- Run focused feature tests and the sample smoke test pattern.
- Run full TypeScript checks.
- Build the docs site if public docs changed.
- Compare OpenAPI JSON against the saved baseline.
- Check logs and sample payloads for secrets or internal-only fields.
- Confirm raw SQL remains parameterized through Drizzle helpers.

## Phase 5: Post-Sample Review

After several endpoints or samples use the same local bridge, record whether the
pattern still belongs in application code.

Ask:

- Did explicit DTOs remain readable?
- Did the local pipe stay small?
- Did the Zod schema remove more duplication than it introduced?
- Did the package need any new runtime dependency? It should not.
- Would a helper feel natural in Nest while still exposing real Drizzle and Zod?

Only propose package helpers when the review answers those questions cleanly and
the helper can stay optional.
