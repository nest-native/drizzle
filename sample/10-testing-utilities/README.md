# Sample 10: Testing Utilities

This sample shows the official test helpers and where mocks are appropriate.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| `DrizzleTestModule.forRoot()` with a real client | `scripts/smoke.ts` |
| `DrizzleTestModule.forFeature()` with repositories | `scripts/smoke.ts` |
| `createDrizzleRepositoryMock()` for service unit tests | `scripts/smoke.ts` |
| `createDrizzleMockClient()` for direct-client unit tests | `scripts/smoke.ts` |
| Real database integration coverage | `src/tasks/tasks.repository.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-10-testing-utilities
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-10-testing-utilities
```

## Why This Matters

The superpower here is honest testing. Use mocks for behavior owned by the unit
under test. Use a real local database when the behavior depends on SQL, Drizzle
schema mapping, ordering, constraints, or transaction semantics.

The repository mock test proves service orchestration. The real database test
proves the repository query shape.

## Post-Sample Review

- Library ergonomics: no package change needed. The existing helpers cover both
  real test clients and shallow mocks.
- Architecture: repository tests should use real clients when query behavior
  matters; service tests can mock repositories when repositories have their own
  focused coverage.
- Documentation: this sample reinforces the mock limits already described in
  the testing docs.
- Performance: no package performance concern found. The real database test
  uses a local libSQL file and stays fast.
- Maintainability: avoid adding richer mocks to the package until repeated
  samples show a common, safe abstraction.
