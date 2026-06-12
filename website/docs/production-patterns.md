---
title: Production Patterns
description: Practical production guidance for connections, tenants, transactions, errors, performance, and security.
---

# Production Patterns

This page collects the production concerns that usually appear after the quick
start works: multiple databases, request scope, transactions, error mapping,
performance, and security.

## Checklist

Before treating an app as production-ready:

- create the driver or pool in application code
- pass a ready Drizzle client to `DrizzleModule`
- provide a shutdown hook for owned driver resources
- generate and apply migrations with standard Drizzle tooling
- expose separate liveness and readiness endpoints for deployment platforms
- place `@Transactional()` on workflow service methods, not every query method
- keep validation and OpenAPI concerns at the HTTP boundary
- prefer real database tests for migrations, transactions, and driver behavior
- review raw SQL for parameterization before merge

## Connection Ownership

Applications own driver construction. Create pools or clients in application
code, pass the ready Drizzle client to `DrizzleModule`, and provide an explicit
shutdown hook when the Nest app owns the driver lifecycle.

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

DrizzleModule.forRoot({
  schema,
  connection: drizzle(pool, { schema }),
  shutdown: () => pool.end(),
});
```

This keeps driver-specific configuration visible: TLS, pool sizing, timeouts,
and connection strings all stay outside the package abstraction.

## Multiple Databases

Use named connections for multiple databases or driver instances:

```ts
DrizzleModule.forRoot({
  connectionName: 'analytics',
  schema: analyticsSchema,
  connection: analyticsDb,
});
```

Inject with the same name:

```ts
constructor(
  @InjectDrizzle('analytics')
  private readonly analytics: AnalyticsDatabase,
) {}
```

Prefer named connections when tenants map to a small, known set of databases.
For high-cardinality tenant routing, keep the routing service in application
code so connection caching, eviction, and authorization rules remain explicit.
Use [Multi-Tenant Applications](multi-tenant.md) for the tenant routing
decision tree, authorization boundaries, cache ownership, and isolation tests.

## Migrations

Keep migration generation and execution app-owned. Use standard Drizzle schema
files and `drizzle-kit` output, commit the generated SQL and metadata, and run
migrations as part of your deployment workflow before normal traffic reaches
the app.

```bash
npm run db:generate --workspace nest-native-drizzle-sample-17-drizzle-kit-migrations
```

For local samples or single-process tools, applying migrations during bootstrap
is acceptable. In production, prefer a dedicated release step or a controlled
single-runner startup path so multiple replicas do not race on the same
migration.

The package intentionally does not expose a Nest migration runner. Drizzle owns
schema and migration files; the application owns when and how database state is
changed.

See the runnable
[`17-drizzle-kit-migrations`](https://github.com/nest-native/drizzle/tree/main/sample/17-drizzle-kit-migrations)
sample for the minimal pattern, and use
[Migration Operations](migration-operations.md) for production release
sequencing, multi-replica safety, backfills, and readiness checks.

## Health And Readiness

Keep liveness and readiness separate:

- liveness should answer whether the process can respond
- readiness should answer whether traffic can be safely routed to the app
- readiness may check database connectivity, migrations, or required startup
  state
- readiness checks should use cheap reads and fail closed when state is missing

```ts
@Get('ready')
ready() {
  return this.healthService.ready();
}
```

Use normal Nest providers for readiness checks. A repository can run a cheap
Drizzle read against a marker table, a migration table, or a driver-specific
ping query. Applications using `@nestjs/terminus` can wrap the same provider in
a Terminus health indicator.

```ts
@Injectable()
export class DrizzleHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly healthRepository: HealthRepository,
  ) {}

  async isHealthy(key = 'database') {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.healthRepository.checkReady();
      return indicator.up();
    } catch {
      return indicator.down({ reason: 'unavailable' });
    }
  }
}
```

Use that indicator from `/health/ready`, not `/health/live`. Terminus is an
application dependency in this shape; it is not part of the published package
contract.

See
[`18-health-readiness`](https://github.com/nest-native/drizzle/tree/main/sample/18-health-readiness)
for a focused liveness/readiness sample.

## Request Scope

Request-scoped services can inject repositories or clients through the normal
Nest provider graph. Keep tenant, user, and trace metadata in request-scoped
application providers. Do not hide tenant switching inside the Drizzle module.

Good boundaries:

- A request-scoped tenant resolver chooses the tenant.
- A service or repository receives that tenant context.
- Drizzle queries stay explicit and parameterized.
- Authorization checks happen before writes.

## Transactions

Use `@Transactional()` at the service method that owns the unit of work. Avoid
placing transaction boundaries on every repository method; that fragments the
business workflow and makes rollback behavior harder to reason about.

Use `@InjectTransaction()` only when a lower-level provider needs the current
transaction object directly.

## Error Mapping

Use `mapDrizzleError()` where persistence errors cross into application
semantics, such as unique email conflicts or foreign-key failures.

```ts
try {
  return await this.usersRepository.create(input);
} catch (error) {
  throw mapDrizzleError(error);
}
```

Do not map every error automatically at the module level. Applications should
choose where database failures become public HTTP exceptions and where they
remain internal errors.

## Performance

Keep the package layer thin:

- Use Drizzle query builders directly for complex reads.
- Use the `sql` template for advanced database features, with parameterized
  values.
- Avoid repositories that wrap every query builder method one-for-one.
- Size pools in application code based on the driver and deployment target.
- Keep OpenAPI generation and validation choices at the HTTP boundary, not in
  repository methods.

For hot paths, measure the actual query and driver behavior first. The package
adds Nest provider wiring, not a query translation layer.

## Security

Review every production PR for:

- SQL injection: never build raw SQL by concatenating request strings.
- Secret leakage: keep tokens, password hashes, and internal metadata out of
  DTOs, docs, logs, and sample payloads.
- Tenant isolation: verify tenant selection before reads and writes.
- Transaction context leaks: keep transaction boundaries scoped to the service
  method that owns the workflow.
- Dependency posture: keep drivers and validation ecosystems as optional peers
  or app-owned dependencies unless the package truly requires them.

Security review should be explicit in PR descriptions, even for docs and sample
changes.
