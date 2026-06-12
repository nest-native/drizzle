# Sample 19: Transaction Isolation Testing

This sample shows how to test `@Transactional()` behavior with a real local
database instead of mocks.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Real libSQL database per test scenario | `scripts/smoke.ts`, `src/database.ts` |
| CLS transaction plugin in a Nest testing module | `scripts/smoke.ts` |
| Commit assertions against real tables | `scripts/smoke.ts`, `src/inventory/inventory.service.ts` |
| Rollback assertions against real tables | `scripts/smoke.ts`, `src/inventory/inventory.service.ts` |
| Transaction context cleanup after each call | `scripts/smoke.ts` |
| Recreate-per-test isolation pattern | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-19-transaction-isolation-testing
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-19-transaction-isolation-testing
```

## Why This Matters

Mocks are useful for provider wiring and service orchestration, but they cannot
prove SQL writes, transaction boundaries, rollback behavior, or CLS context
cleanup. This sample uses a fresh local database file for each scenario so the
tests stay deterministic while still exercising the real Drizzle client and
transaction adapter.

Use this pattern when a test needs to prove commit/rollback semantics. Keep
`DrizzleTestModule` mocks for shallow unit tests where SQL behavior is not part
of the contract being tested.

## Post-Sample Review

- Library ergonomics: no package change needed. The app-owned Nest testing
  module is explicit and mirrors production transaction setup.
- Architecture: recreate-per-test database files are a clear default for
  transaction behavior tests. Rollback-per-test helpers can stay app-owned until
  multiple samples show a common safe abstraction.
- Documentation: testing docs should include a decision table that separates
  mock tests, local real database tests, service-backed driver tests, and
  transaction isolation tests.
- Performance: no package concern found. The local libSQL database keeps the
  sample fast enough for focused CI validation.
- Maintainability: keep transaction fixtures close to the app schema so tests do
  not hide migration, seeding, or driver lifecycle decisions.
