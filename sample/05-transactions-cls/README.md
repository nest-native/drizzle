# Sample 05: CLS Transactions

This sample shows `@Transactional()` with the real
`@nestjs-cls/transactional` Drizzle adapter.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| CLS transaction plugin setup | `src/app.module.ts` |
| Drizzle adapter token wiring | `src/app.module.ts` |
| `@Transactional()` commit and rollback | `src/transfers/transfers.service.ts` |
| Transaction context shared across services | `src/accounts/accounts.service.ts`, `src/ledger/ledger.service.ts` |
| Real rollback assertions | `scripts/smoke.ts` |
| Repository query organization | `src/accounts/accounts.repository.ts`, `src/ledger/ledger.repository.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-05-transactions-cls
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-05-transactions-cls
```

## Why This Matters

The superpower here is a Nest method decorator that coordinates a real Drizzle
transaction across multiple injected services. The transfer service owns the
transaction boundary, while account and ledger services use the current
transaction context without passing database clients through controllers.

## Post-Sample Review

- Library ergonomics: no package change needed. The transaction setup is
  explicit because the CLS adapter owns transaction context.
- Architecture: services should keep transaction boundaries at workflow methods,
  not inside low-level repositories.
- Documentation: transaction docs and the sample catalog link this as the
  canonical commit/rollback example.
- Performance: no package performance concern found. The CLS plugin adds
  transaction context only around decorated methods.
- Maintainability: the adapter setup is verbose but honest. Avoid hiding it in
  the package unless a stable helper can support multiple Drizzle drivers.
