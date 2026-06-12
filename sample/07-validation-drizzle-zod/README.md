# Sample 07: Drizzle-Zod Validation

This sample shows request validation derived from a Drizzle table schema with
`drizzle-zod`.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Drizzle table as source of truth | `src/schema.ts` |
| `drizzle-zod` insert schema generation | `src/tickets/ticket.validation.ts` |
| Nest route validation with a Zod pipe | `src/zod-validation.pipe.ts`, `src/tickets/tickets.controller.ts` |
| Invalid payload rejection before writes | `scripts/smoke.ts` |
| Valid payload persistence with real Drizzle queries | `src/tickets/tickets.repository.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-07-validation-drizzle-zod
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-07-validation-drizzle-zod
```

## Why This Matters

The superpower here is a single-source path from Drizzle schema to runtime
validation. The Nest controller receives a validated body, while the repository
still writes through normal Drizzle queries.

Use this when your API shape matches your insert schema closely. Keep separate
DTOs or custom schemas when the public API intentionally differs from database
columns.

## Post-Sample Review

- Library ergonomics: no package change needed. Validation belongs naturally in
  Nest pipes, and the sample can keep the pipe local.
- Architecture: `drizzle-zod` works best as a schema-derived validation layer,
  while services and repositories keep their usual Nest responsibilities.
- Documentation: sample docs should call this the schema-derived validation
  path and leave class-validator for the next focused sample.
- Performance: no package performance concern found. Validation runs once at
  the route boundary before database work.
- Maintainability: if later samples repeat the Zod pipe, consider a shared
  sample helper before promoting anything into the package.
