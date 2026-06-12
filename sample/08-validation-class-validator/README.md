# Sample 08: Class-Validator DTO Validation

This sample shows classic NestJS DTO validation with `class-validator`,
`class-transformer`, and `ValidationPipe`.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| DTO validation decorators | `src/customers/create-customer.dto.ts` |
| Global Nest `ValidationPipe` | `src/app.module.ts` |
| Drizzle-backed repository writes | `src/customers/customers.repository.ts` |
| Invalid payload rejection before writes | `scripts/smoke.ts` |
| Valid DTO persistence with transformed values | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-08-validation-class-validator
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-08-validation-class-validator
```

## Why This Matters

The superpower here is that classic Nest DTO validation coexists cleanly with
Drizzle schemas. DTOs describe the public HTTP contract, while Drizzle tables
remain the database contract.

Use this when your API model intentionally differs from your database table, or
when your team already standardizes on `ValidationPipe` and DTO classes.

## Post-Sample Review

- Library ergonomics: no package change needed. Nest's built-in validation
  pipeline already owns DTO validation well.
- Architecture: DTOs should sit at the HTTP boundary; repositories should keep
  receiving validated application input and writing through Drizzle.
- Documentation: this sample complements the Drizzle-Zod sample by showing the
  classic Nest validation path.
- Performance: no package performance concern found. Transformation and
  validation happen once at the route boundary.
- Maintainability: no shared helper is needed yet; the global pipe setup is
  short and idiomatic.
