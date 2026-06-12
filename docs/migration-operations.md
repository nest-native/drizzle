# Migration Operations

`@nest-native/drizzle` does not run or generate migrations for you. Drizzle owns
schema and migration files; your application owns when database state changes.
That boundary keeps deploy behavior visible and driver-aware.

The runnable
[`17-drizzle-kit-migrations`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/17-drizzle-kit-migrations)
sample shows the basic pattern. This page covers the production decisions that
usually come next.

## Recommended Release Flow

1. Change Drizzle schema files in application code.
2. Generate migrations with `drizzle-kit`.
3. Review generated SQL and metadata.
4. Commit the generated migration files.
5. Run migrations once in a release job or controlled migration phase.
6. Start application replicas after the migration phase succeeds.
7. Route traffic only after readiness succeeds.

Avoid letting every application replica apply migrations during scale-out. That
can create lock contention, duplicate work, and hard-to-debug release failures.

## Release Job vs Startup Migration

| Strategy | Use when | Avoid when |
| --- | --- | --- |
| Dedicated release job | Production deploys, multiple replicas, shared databases | The platform cannot guarantee the job runs before traffic |
| Controlled single-runner startup | Small apps, one replica, preview environments | Autoscaling or rolling deploys can start several replicas at once |
| Application bootstrap migration | Local development and samples | Production traffic can reach the process before migration status is known |

When in doubt, prefer a release job. The Nest app should normally receive an
already migrated Drizzle client.

## Backward-Compatible Changes

For zero-downtime releases, split risky schema changes into multiple deploys.

### Add Nullable Column

1. Add the column as nullable or with a safe default.
2. Deploy code that can read old and new rows.
3. Backfill existing rows.
4. Switch writes to populate the column.
5. Enforce `not null` or stricter constraints in a later migration.

### Rename Column

1. Add the new column.
2. Write to both old and new columns.
3. Backfill old rows into the new column.
4. Switch reads to the new column.
5. Stop writing the old column.
6. Drop the old column in a later release.

### Tighten Constraint

1. Add validation at the application boundary.
2. Backfill or clean existing rows.
3. Add the database constraint.
4. Keep a real database test for the failure path.

Do not combine data cleanup, read-path changes, write-path changes, and strict
constraints in one high-risk migration unless the maintenance window explicitly
allows it.

## Multi-Replica Safety

Production migration execution should have one owner:

- a release job in the deployment platform
- a CI/CD migration step with production approval
- a single-runner task or one-off command
- a manually triggered maintenance operation

Application replicas should not race to become the migration runner. If your
platform only supports startup hooks, add an external lock or platform-level
singleton guarantee before using startup migrations in production.

## Readiness After Migrations

Readiness should fail closed until the app can serve traffic safely. Depending
on your deployment, readiness can check:

- database connectivity
- required tables or marker rows
- migration table state
- required seed or reference data

Keep the check cheap. Do not run a full migration diff, large aggregate query,
or write operation from a load-balancer readiness endpoint.

## Security And Logging

Migration logs are useful, but they can also leak sensitive information.

- Do not log production connection strings.
- Do not log SQL that includes copied production data or secrets.
- Keep migration SQL generated from reviewed schema files, not request input.
- Store database credentials in the deployment platform secret manager.
- Use disposable credentials in CI and local examples.

Raw SQL migrations should still use parameterized values or reviewed static SQL.
Never build migration SQL by concatenating untrusted input.

## Testing Migration Paths

Use real database tests for migration behavior. Mocks cannot prove generated
SQL, constraints, indexes, or driver behavior.

Recommended coverage:

- migration applies to an empty database
- application starts against a migrated database
- repository queries work after migration
- rollback plan is documented for risky releases
- service-backed drivers run in CI when dialect behavior matters

The focused
[`17-drizzle-kit-migrations`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/17-drizzle-kit-migrations)
sample demonstrates migrated startup against a local database. The
[`15-postgres-driver`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/15-postgres-driver)
and
[`16-mysql-driver`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/16-mysql-driver)
samples show how CI-backed service databases fit into the same app-owned model.
