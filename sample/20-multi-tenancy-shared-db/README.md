# Sample 20: Multi-Tenancy (Shared Database)

This sample turns the [Multi-Tenant](../../docs/multi-tenant.md) guidance into a
runnable proof. It shows shared-database multi-tenancy with an authenticated
`TenantContext`, repository-enforced tenant predicates, and **negative tests
that prove cross-tenant reads and writes are rejected**.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Authenticated `TenantContext` (request-scoped) | `src/auth/tenant.context.ts` |
| Guard that resolves user from `x-api-key` (never trusts a client tenant header) | `src/auth/api-key.guard.ts` |
| Repository methods that always include a `tenant_id` predicate | `src/projects/projects.repository.ts` |
| Service that injects `TenantContext` and refuses to leak existence | `src/projects/projects.service.ts` |
| `@Transactional()` write with a tenant predicate inside the transaction | `src/projects/projects.service.ts` (`archive`) |
| DTOs with `class-validator` and `whitelist`/`forbidNonWhitelisted` | `src/projects/*.dto.ts`, `src/app.module.ts` |
| Negative smoke tests for cross-tenant access | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-20-multi-tenancy-shared-db
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-20-multi-tenancy-shared-db
```

## Scenario

Two tenants share one database:

- `acme` with user **Alice** (API key `acme-alice-key`)
- `globex` with user **Bob** (API key `globex-bob-key`)

The API exposes:

- `GET /projects` — list (scoped to the caller's tenant)
- `GET /projects/:id` — fetch one (404 if owned by another tenant)
- `POST /projects` — create (tenant set from context, never from the body)
- `PATCH /projects/:id` — rename (404 if owned by another tenant)
- `POST /projects/:id/archive` — archive + audit (`@Transactional`, 404 if owned by another tenant)
- `GET /projects/audits` — audit log (scoped to the caller's tenant)

## What The Smoke Test Proves

The smoke script (`scripts/smoke.ts`) makes real HTTP requests against a real
libSQL database. It explicitly asserts:

1. Requests without `x-api-key` are rejected with `401`.
2. Requests with an unknown API key are rejected with `401`.
3. Each user's list view only contains projects from their own tenant.
4. Attacker-supplied `tenantId` in a `POST /projects` body is rejected by the
   DTO (`forbidNonWhitelisted`). Even if it were not, the server would ignore
   the body's `tenantId` and use the context's `tenantId`.
5. Fetching a foreign-tenant project by ID returns `404` — **never** `403` or
   `200`, so the response does not leak the existence of the row.
6. Renaming a foreign-tenant project returns `404` and does not mutate the
   target row.
7. Archiving a foreign-tenant project returns `404`, leaves the target row
   `active`, and writes **no** audit record to either tenant.
8. Archiving an own-tenant project writes both the status change and the audit
   row inside one transaction, both stamped with the caller's tenant.
9. Renaming an own-tenant project succeeds.

## Design Notes

### Tenant Resolution

`ApiKeyGuard` is the only place that reads the request — it looks up a user
by API key and attaches the trusted `AuthenticatedUser` to the request. The
guard never trusts a `x-tenant-id` header or any other client-supplied tenant
identifier. The `TenantContext` then reads the tenant from
`request.user.tenantId`, which a real application would replace with a JWT
claim, session, API-key-to-user lookup, or whatever it already uses.

### Repository Discipline

Every repository method that touches `projects` or `project_audits` takes a
`tenantId` argument and combines it into the `WHERE` clause with `and(eq(...),
...)`. The service layer is the only place that reads the tenant from
context, so repositories are easy to test in isolation.

### Transaction Boundary

`ProjectsService.archive()` is annotated with `@Transactional()` and uses
`txHost.tx` so both the status update and the audit insert happen inside the
same transaction with the same tenant predicate. If the audit write fails, the
status update rolls back.

### Why 404 Instead of 403

Returning `403 Forbidden` on a cross-tenant access reveals that the resource
exists. The repository simply filters by tenant in the same query that loads
the row, so the service cannot distinguish "row missing" from "row owned by
another tenant". Both produce a `404`. This matches the behavior recommended
in [`docs/multi-tenant.md`](../../docs/multi-tenant.md#authorization-rules).

### What This Sample Does Not Do

- It does **not** add tenant routing to `DrizzleModule`. The package stays a
  connection registration layer; the security boundary is in application code.
- It does **not** enforce "every repository must include a tenant predicate"
  at compile time. The negative tests catch the patterns this sample
  demonstrates, but an ESLint rule or repository base class is out of scope.
  Treat the negative tests as a template you add for every tenant-scoped
  table.
- It does **not** demonstrate per-tenant databases. See
  [`04-named-connections`](../04-named-connections) for the named-connection
  baseline and [`docs/multi-tenant.md`](../../docs/multi-tenant.md) for the
  dynamic routing discussion.

## Post-Sample Review

- **Library ergonomics**: No package change needed. `@InjectDrizzle()`,
  `@DrizzleRepository()`, `@Transactional()`, and request-scoped providers
  already cover this pattern cleanly.
- **Architecture**: A guard-populated `AuthenticatedUser` plus a request-scoped
  `TenantContext` is a reasonable Nest-native default for shared-database
  multi-tenancy. Repositories that take `tenantId` as an explicit argument keep
  the contract testable.
- **Documentation**: `docs/multi-tenant.md` should link to this sample as
  runnable proof of the shared-database pattern.
- **Performance**: No package concern found. The local libSQL database keeps
  the smoke fast enough for CI.
- **Maintainability**: A future ESLint rule that flags repository methods
  touching tenant-scoped tables without a `tenant_id` predicate could harden
  the pattern further. Park it until multiple samples demonstrate the same
  need.
