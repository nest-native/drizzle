# Multi-Tenant Applications

`@nest-native/drizzle` gives tenant-aware applications stable Nest provider
tokens, but it does not choose tenants for you. Keep tenant resolution,
authorization, connection caching, and eviction in application code so the
security boundary stays visible.

## Choose The Tenant Model

Use the simplest model that matches the product:

| Model | Use When | Package Pattern |
| --- | --- | --- |
| One shared database with `tenant_id` columns | Tenants share schema and operational lifecycle | Inject one Drizzle client and require tenant predicates in repositories |
| Small known set of databases | Tenant databases are fixed at deploy time | Register each client with `connectionName` and inject the correct named connection |
| Many dynamic databases | Tenant databases are created or changed at runtime | Build an app-owned routing service with explicit connection cache rules |

The package should not hide dynamic routing behind automatic tenant switching.
High-cardinality routing needs product-specific rules for authorization,
connection lifetime, pool limits, eviction, observability, and incident
response.

## Shared Database

For a shared database, resolve the tenant at the HTTP boundary and pass trusted
tenant context into services or repositories.

```ts
type TenantRequest = Request & { user: { tenantId: string } };

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly request: TenantRequest) {}

  get tenantId() {
    return assertKnownTenant(this.request.user.tenantId);
  }
}
```

Use that context when building queries:

```ts
@DrizzleRepository()
export class ProjectsRepository {
  constructor(
    @InjectDrizzle() private readonly db: AppDatabase,
    private readonly tenantContext: TenantContext,
  ) {}

  findVisibleProjects() {
    return this.db.query.projects.findMany({
      where: (projects, { eq }) =>
        eq(projects.tenantId, this.tenantContext.tenantId),
    });
  }
}
```

Do not accept a tenant ID from an untrusted header and pass it directly into a
query. Validate it against authenticated user claims, session state, API key
metadata, or an authorization service before query execution.

## Small Known Set Of Tenant Databases

When the set of databases is known at deploy time, named connections keep the
wiring explicit:

```ts
DrizzleModule.forRoot({
  connectionName: 'tenant-eu',
  schema,
  connection: euDb,
  shutdown: () => euPool.end(),
});

DrizzleModule.forRoot({
  connectionName: 'tenant-us',
  schema,
  connection: usDb,
  shutdown: () => usPool.end(),
});
```

Inject the connection that a provider owns:

```ts
@DrizzleRepository('tenant-eu')
export class EuReportsRepository {
  constructor(
    @InjectDrizzle('tenant-eu')
    private readonly db: AppDatabase,
  ) {}
}
```

Use the
[`04-named-connections`](../sample/04-named-connections)
sample as the baseline. It proves that schemas and queries stay isolated when
repositories inject the named client they own.

## Dynamic Tenant Databases

For many tenant databases, keep routing in a normal Nest service. That service
can resolve the tenant, authorize access, and return an app-owned Drizzle
client.

```ts
@Injectable()
export class TenantDatabaseRouter {
  constructor(
    private readonly tenantRegistry: TenantRegistry,
    private readonly connectionCache: TenantConnectionCache,
  ) {}

  async getClient(user: AuthenticatedUser, tenantSlug: string) {
    const tenant = await this.tenantRegistry.findBySlug(tenantSlug);
    assertTenantAccess(user, tenant);

    return this.connectionCache.getOrCreate(tenant.databaseUrl);
  }
}
```

Keep the cache implementation outside the package. It should define:

- maximum open connections or pools
- idle eviction and shutdown behavior
- retry and circuit-breaker policy
- metrics for active tenants and connection churn
- redaction rules for connection URLs and driver errors

Repositories can still be useful, but they should receive the routed client
explicitly from the service that owns the workflow.

```ts
@Injectable()
export class TenantProjectsService {
  constructor(
    private readonly router: TenantDatabaseRouter,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async list(user: AuthenticatedUser, tenantSlug: string) {
    const db = await this.router.getClient(user, tenantSlug);
    return this.projectsRepository.findVisibleProjects(db, user);
  }
}
```

## Authorization Rules

Tenant isolation is an application security boundary. Enforce it before any
tenant-scoped read or write:

- derive tenant identity from authenticated state, not raw request headers
- verify the user or API key belongs to the tenant
- keep cross-tenant admin flows separate from normal tenant routes
- include tenant predicates in shared-database queries
- fail closed when the tenant is missing, disabled, or ambiguous
- avoid logging tenant database URLs, driver credentials, or raw SQL errors

`@UseGuards()` and request-scoped providers are good Nest boundaries for this
logic. The Drizzle module should remain a connection registration layer, not an
authorization layer.

## Testing

Cover tenant behavior with real integration tests where possible:

- a user from tenant A cannot read tenant B data
- shared-database repositories always include tenant predicates
- named-connection repositories use the intended connection token
- dynamic routing closes or evicts cached connections
- readiness fails when a required tenant database is unavailable

Unit tests can mock the routing service, but isolation and migration behavior
should use real driver-backed tests before production release.
