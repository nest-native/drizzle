# Sample 11: Safe Raw SQL Escape Hatch

This sample shows how to keep Drizzle-native raw SQL available for reporting
queries while still using Nest modules, providers, and repository boundaries.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| `DrizzleModule.forRoot()` with a local libSQL client | `src/app.module.ts` |
| Repository registration with `DrizzleModule.forFeature()` | `src/reports/reports.module.ts` |
| Drizzle `sql` template for parameterized raw SQL | `src/reports/reports.repository.ts` |
| Optional raw SQL fragments without string concatenation | `src/reports/reports.repository.ts` |
| HTTP smoke coverage for the raw SQL path | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-11-raw-sql-escape-hatch
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-11-raw-sql-escape-hatch
```

## Why This Matters

The superpower here is that the library does not hide Drizzle. Most application
queries can use Drizzle's fluent API, but complex reports, window functions,
vendor-specific expressions, or carefully tuned SQL can stay explicit and still
live inside regular Nest providers.

Keep raw SQL at repository boundaries. Expose domain-shaped methods such as
`revenueBySegment()` to services and controllers instead of leaking SQL strings
through the application.

## Security Notes

Use Drizzle's `sql` template for values:

```ts
sql`AND c.segment = ${segment}`
```

Do not build SQL from user input with string concatenation or unchecked
`sql.raw()`. Reserve raw identifiers or fragments for trusted, fixed strings
that are chosen by application code, not request data.

## Post-Sample Review

- Library ergonomics: no package change needed. The existing injection and
  repository APIs let raw SQL stay as plain Drizzle code.
- Architecture: repository methods are the right place for advanced SQL because
  services receive domain-shaped results instead of query details.
- Documentation: this sample should be the canonical advanced-query reference
  and should be cross-linked from the sample superpowers page.
- Performance: no package performance concern found. Raw SQL can be a deliberate
  performance tool when query shape matters.
- Maintainability: avoid adding a library-level SQL helper unless repeated
  samples reveal a Nest-specific concern that Drizzle itself does not cover.
