# Sample 09: Database Error Mapping

This sample shows opt-in database error mapping with real constraint failures.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Unique constraint violation | `scripts/smoke.ts` |
| Not-null constraint violation | `src/members/members.repository.ts` |
| `mapDrizzleError()` at a repository boundary | `src/members/members.repository.ts` |
| Nest HTTP responses from mapped exceptions | `scripts/smoke.ts` |
| Real Drizzle writes before and after failures | `src/members/members.repository.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-09-error-mapping
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-09-error-mapping
```

## Why This Matters

The superpower here is explicit database error translation. Drizzle still
returns driver errors, and your application decides where those errors become
Nest exceptions such as `409 Conflict` or `400 Bad Request`.

Use this at repository or service boundaries where persistence details meet
HTTP/application semantics. Avoid hiding it globally unless every database
failure in the application should use the same policy.

## Post-Sample Review

- Library ergonomics: no package change needed. The mapper is intentionally
  opt-in and fits well at repository boundaries.
- Architecture: map low-level persistence failures before they cross into
  controllers, but keep messages domain-specific.
- Documentation: the sample should be the canonical error mapping reference
  because it proves real driver behavior.
- Performance: no package performance concern found. Mapping only runs on error
  paths.
- Maintainability: if more driver-specific examples arrive later, add focused
  tests or docs before widening the mapper API.
