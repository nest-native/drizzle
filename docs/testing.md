# Testing

The package provides two testing helpers:

- `DrizzleTestModule` registers a client under the same DI tokens as
  `DrizzleModule`.
- `createDrizzleMockClient()` and `createDrizzleRepositoryMock()` create simple,
  typed object mocks.

## Unit Tests

Use mocks when you want to isolate a service from SQL behavior.

```ts
import { Test } from '@nestjs/testing';
import {
  DrizzleTestModule,
  createDrizzleMockClient,
} from '@nest-native/drizzle';

const db = createDrizzleMockClient({
  query: {
    users: {
      findMany: () => [{ id: 'user_1', name: 'Ada' }],
    },
  },
});

const moduleRef = await Test.createTestingModule({
  imports: [DrizzleTestModule.forRoot({ client: db })],
  providers: [UsersService],
}).compile();
```

This is useful for fast service tests, but it is intentionally shallow. It does
not prove SQL syntax, schema mapping, driver behavior, or transaction behavior.

Good mock tests answer questions like:

- did the service call the expected repository method?
- did it map application input before persistence?
- did it handle a repository error path?

Avoid using mocks to approve query builders, migrations, constraints, ordering,
driver shutdown, or transaction boundaries. Those are database behaviors and
need a real client somewhere in the test suite.

## Repository Tests

Use repository mocks when a service depends on a repository and the repository
has its own focused tests.

```ts
const usersRepository = createDrizzleRepositoryMock<UsersRepository>({
  findById: async id => ({ id, name: 'Ada' }),
});
```

Repository implementations should usually get at least one real database test.
The smallest useful pattern is:

1. create a local disposable database file
2. register it with `DrizzleTestModule.forRoot()`
3. register repositories with `DrizzleTestModule.forFeature()`
4. create tables or apply migrations
5. assert inserts, updates, filters, ordering, and constraints with real rows

The
[`10-testing-utilities`](https://github.com/nest-native/drizzle/tree/main/sample/10-testing-utilities)
sample shows this split: service orchestration uses repository mocks, while the
repository query shape uses a real libSQL database.

## Integration Tests

Use a real Drizzle client when the behavior being tested depends on the
database:

- query shape and selected columns
- migrations or table setup
- inserts, updates, deletes, and ordering
- transaction commit and rollback
- driver-specific behavior

The package test suite includes real driver integration coverage for libSQL,
better-sqlite3, PostgreSQL, and MySQL. The CI suite runs PostgreSQL and MySQL
through service containers, while local runs skip those two unless connection
URLs are provided.

### Local Real Database Tests

Use local file-backed databases for fast integration tests that should run on
every machine and in every pull request. This is the right default for:

- repository query behavior
- migrations against SQLite-compatible schemas
- basic module wiring with real clients
- transaction commit and rollback behavior that does not depend on a specific
  networked driver

Prefer unique database files per test or per scenario. That keeps tests
parallel-friendly and prevents previous runs from leaving hidden state behind.

Inspect:

- [`10-testing-utilities/scripts/smoke.ts`](https://github.com/nest-native/drizzle/tree/main/sample/10-testing-utilities/scripts/smoke.ts)
- [`17-drizzle-kit-migrations/scripts/smoke.ts`](https://github.com/nest-native/drizzle/tree/main/sample/17-drizzle-kit-migrations/scripts/smoke.ts)
- [`19-transaction-isolation-testing/scripts/smoke.ts`](https://github.com/nest-native/drizzle/tree/main/sample/19-transaction-isolation-testing/scripts/smoke.ts)

### Service-Backed Driver Tests

Use PostgreSQL, MySQL, or another service-backed driver when the behavior
depends on that dialect or driver:

- pool construction and shutdown
- SQL dialect differences
- generated column types and constraint behavior
- driver-specific errors
- production-like connection settings

Local runs should skip these tests when their URL is missing. CI should provide
disposable services and run the real round trip before merge.

```bash
NEST_DRIZZLE_NATIVE_POSTGRES_URL=postgresql://user:password@127.0.0.1:5432/app \
  npm run test --workspace nest-native-drizzle-sample-15-postgres-driver

NEST_DRIZZLE_NATIVE_MYSQL_URL=mysql://user:password@127.0.0.1:3306/app \
  npm run test --workspace nest-native-drizzle-sample-16-mysql-driver
```

Use local-only credentials or disposable CI credentials for these commands.
Never commit production database URLs or captured production data.

Inspect:

- [`15-postgres-driver`](https://github.com/nest-native/drizzle/tree/main/sample/15-postgres-driver)
- [`16-mysql-driver`](https://github.com/nest-native/drizzle/tree/main/sample/16-mysql-driver)

### Transaction Behavior Tests

Transaction tests must assert database state before and after the call. A mock
can say that a method was called; it cannot prove that a rollback removed a row
or that transaction context was cleaned up.

Good transaction tests check:

- state before the workflow starts
- state after a committed workflow
- state after a failed workflow
- ledger/audit rows that should commit or roll back with the main write
- `TransactionHost.isTransactionActive()` or equivalent context checks after
  the method returns

Use recreate-per-test databases first. Rollback-per-test fixtures can be useful
later, but only after the application has enough test volume to justify the
extra setup.

## Choosing Test Depth

| Test goal | Recommended setup | Why |
| --- | --- | --- |
| Provider wiring or service orchestration | `DrizzleTestModule` with `createDrizzleMockClient()` or repository mocks | Fast and focused on Nest collaboration, not SQL behavior |
| Query shape, ordering, constraints, or migrations | Real local Drizzle client with a local database file | Proves the schema and SQL path without external services |
| Driver-specific behavior | Real service-backed driver such as PostgreSQL or MySQL | Catches pool, dialect, and driver lifecycle behavior |
| Commit, rollback, and transaction context cleanup | Real local database with recreate-per-test or rollback-per-test isolation | Mocks cannot prove transaction semantics |

For transaction behavior, prefer a fresh local database per scenario until the
application has enough test volume to justify a shared rollback fixture. The
[`19-transaction-isolation-testing`](https://github.com/nest-native/drizzle/tree/main/sample/19-transaction-isolation-testing)
sample demonstrates the recreate-per-test pattern with real `@Transactional()`
calls.

## Local Commands

```bash
npm run test
npm run test:cov
npm run ci
```

`npm run test:cov` writes `coverage/coverage-summary.json` and
`test-results.json`, which are used by the GitHub coverage and performance
comments.
