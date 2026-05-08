# Samples

The sample tree follows the same shape as the main quality strategy:

- `00-showcase`: the full integration baseline.
- `01-*` onward: focused samples that isolate one topic each.

## Commands

```bash
npm run ci:sample
npm run showcase
npm run sample:focused
npm run test --workspace nest-drizzle-native-showcase
npm run test --workspace nest-drizzle-native-sample-01-basic-client
npm run test --workspace nest-drizzle-native-sample-02-repositories
npm run test --workspace nest-drizzle-native-sample-03-for-root-async
npm run test --workspace nest-drizzle-native-sample-04-named-connections
npm run test --workspace nest-drizzle-native-sample-05-transactions-cls
npm run test --workspace nest-drizzle-native-sample-06-manual-transaction
npm run test --workspace nest-drizzle-native-sample-07-validation-drizzle-zod
npm run test --workspace nest-drizzle-native-sample-08-validation-class-validator
npm run test --workspace nest-drizzle-native-sample-09-error-mapping
npm run test --workspace nest-drizzle-native-sample-10-testing-utilities
npm run test --workspace nest-drizzle-native-sample-11-raw-sql-escape-hatch
npm run test --workspace nest-drizzle-native-sample-12-swagger-openapi
npm run test --workspace nest-drizzle-native-sample-13-zod-openapi-bridge
npm run test --workspace nest-drizzle-native-sample-14-better-sqlite3-driver
```

`npm run sample:focused` discovers focused samples from `sample/*/package.json`
and runs them in folder order. Keep the explicit workspace commands above for
targeted local debugging.

## Catalog

| Folder | Focus | State | Command |
| --- | --- | --- | --- |
| `00-showcase` | Full integration baseline | Runnable | `npm run showcase` |
| `01-basic-client-injection` | Direct `@InjectDrizzle()` client injection | Runnable | `npm run test --workspace nest-drizzle-native-sample-01-basic-client` |
| `02-repositories` | `@DrizzleRepository()` and `forFeature()` | Runnable | `npm run test --workspace nest-drizzle-native-sample-02-repositories` |
| `03-for-root-async` | Async configuration and shutdown | Runnable | `npm run test --workspace nest-drizzle-native-sample-03-for-root-async` |
| `04-named-connections` | Multiple Drizzle clients | Runnable | `npm run test --workspace nest-drizzle-native-sample-04-named-connections` |
| `05-transactions-cls` | CLS-backed `@Transactional()` | Runnable | `npm run test --workspace nest-drizzle-native-sample-05-transactions-cls` |
| `06-manual-transaction` | `@InjectTransaction()` escape hatch | Runnable | `npm run test --workspace nest-drizzle-native-sample-06-manual-transaction` |
| `07-validation-drizzle-zod` | Drizzle schema to Zod validation | Runnable | `npm run test --workspace nest-drizzle-native-sample-07-validation-drizzle-zod` |
| `08-validation-class-validator` | DTO validation with `ValidationPipe` | Runnable | `npm run test --workspace nest-drizzle-native-sample-08-validation-class-validator` |
| `09-error-mapping` | Opt-in database error mapping | Runnable | `npm run test --workspace nest-drizzle-native-sample-09-error-mapping` |
| `10-testing-utilities` | Test module and mock helpers | Runnable | `npm run test --workspace nest-drizzle-native-sample-10-testing-utilities` |
| `11-raw-sql-escape-hatch` | Safe raw SQL patterns | Runnable | `npm run test --workspace nest-drizzle-native-sample-11-raw-sql-escape-hatch` |
| `12-swagger-openapi` | Swagger/OpenAPI integration | Runnable | `npm run test --workspace nest-drizzle-native-sample-12-swagger-openapi` |
| `13-zod-openapi-bridge` | Optional Drizzle-Zod validation with Swagger contracts | Runnable | `npm run test --workspace nest-drizzle-native-sample-13-zod-openapi-bridge` |
| `14-better-sqlite3-driver` | better-sqlite3 driver setup and shutdown | Runnable | `npm run test --workspace nest-drizzle-native-sample-14-better-sqlite3-driver` |

## Sample Rules

Sample PRs must not include package source changes under `packages/drizzle/**`.
If a sample exposes a package bug, pause the sample branch and fix the package in
a separate PR first.

After each sample implementation, do a short follow-up review before opening or
updating the PR:

- **Library ergonomics**: Did the sample reveal an awkward API, missing helper,
  confusing type, or repetitive setup that belongs in `packages/drizzle`?
- **Architecture**: Did the sample need a pattern that should become the
  recommended Nest-native structure for modules, repositories, transactions, or
  testing?
- **Documentation**: Did the sample teach something that should be promoted to
  the README, Docusaurus docs, or API reference?
- **Performance**: Did the sample reveal unnecessary connection work, slow test
  setup, excessive boot cost, or query patterns that need guidance?
- **Maintainability**: Did the sample duplicate code that should become a shared
  sample helper, documented convention, or future library improvement?

Keep those follow-ups out of the sample PR unless they are documentation-only
changes that directly explain the sample. For library code, architectural
refactors, performance work, or package behavior changes, open a separate issue
or PR and reference it from the sample PR.

## Local Database Convention

Focused samples use local database files where possible so they run in CI
without external services. That setup is intentionally sample-local: it
demonstrates driver construction and cleanup without adding test-only helpers to
the published package API.

If more samples repeat the same setup, prefer shared guidance or helper code
inside `sample/` over changes in `packages/drizzle`.
