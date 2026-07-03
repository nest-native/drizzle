# Sample 21: Read Replicas With `withReplicas`

This sample registers a drizzle-orm `withReplicas` client through
`DrizzleModule.forRoot()` and proves the read/write routing end to end.

`withReplicas` returns a regular Drizzle client, so it needs zero support from
this package: the module stores whatever client the application constructs and
never rewires it. The same bring-your-own-client boundary is what makes other
"exotic" clients (Cloudflare D1, remote libSQL/Turso, AWS Data API) work
without dedicated integrations.

The sample stays fully local: the "primary" and the "replica" are two separate
`better-sqlite3` database files. The replica file is created by copying the
primary file once at startup — a point-in-time snapshot that never receives
later writes, as if replication lag were infinite. That frozen copy is what
makes routing observable.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| `withReplicas(primary, [replica])` construction | `src/database.ts` |
| Routed client passed as-is to `connection` | `src/app.module.ts` |
| Routed reads (`select` goes to the replica) | `src/events/events.repository.ts` (`list`) |
| Routed writes (`insert` goes to the primary) | `src/events/events.repository.ts` (`create`) |
| `$primary` escape hatch for read-your-own-write | `src/events/events.repository.ts` (`listFromPrimary`) |
| Shutdown hook closing both driver handles | `src/app.module.ts` |
| Routing proven over HTTP and at the file level | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-native-drizzle-sample-21-read-replicas
```

## Validate

```bash
npm run test --workspace nest-native-drizzle-sample-21-read-replicas
```

## How Routing Is Proven

`withReplicas` sends `select`, `selectDistinct`, `$count`, `with`, and `query`
to a replica; `insert`, `update`, `delete`, `run`, and `transaction` go to the
primary; `$primary` always targets the primary directly.

The smoke test (`scripts/smoke.ts`) exploits the frozen replica snapshot:

1. Both views start with only the replicated `replica.snapshot.captured` row.
2. `POST /events` writes an `orders.created` row through the routed client.
3. `GET /events` (routed read) still returns **only** the snapshot row. The new
   row is missing because the replica never received it — if reads hit the
   primary, the assertion would fail.
4. `GET /events/primary` (`$primary` read) returns the new row plus the
   snapshot row, proving the write landed on the primary and that `$primary`
   bypasses replica routing.
5. Finally the script opens both database files read-only with raw
   `better-sqlite3` handles and asserts the primary file contains the written
   row while the replica file does not — routing proven at the file level,
   independent of the HTTP app.

## Schema Setup

Schema DDL runs against the raw driver handles in `src/database.ts` before the
routed client exists. That mirrors production, where replicas receive schema
changes through replication — DDL executed through the routed client would
only reach the primary.

## Why This Matters

Read/write splitting is an application topology decision, not a package
feature. Because `DrizzleModuleOptions.connection` accepts any Drizzle client
the app constructs, the drizzle-orm `withReplicas` helper (available for the
Postgres, MySQL, SQLite, SingleStore, and Gel dialects) drops in unchanged, and
repositories keep injecting one `AppDatabase` type with `$primary` available
where read-your-own-write semantics matter.

## Post-Sample Review

- Library ergonomics: no package change needed. `connection` accepts the
  `SQLiteWithReplicas` client as-is, and `shutdown` handles closing both
  driver handles.
- Architecture: replica topology belongs in application code. The app decides
  the replica selection strategy (the optional `getReplica` callback) and when
  to escape to `$primary`; the module only provides injection and lifecycle.
- Documentation: this fills the read-replica gap in the driver story and gives
  the docs a runnable reference for the "any Drizzle client works" claim.
- Performance: no package performance concern found. Routing is resolved by
  drizzle-orm per call; the module adds no indirection on the query path.
- Maintainability: the two-file SQLite approach keeps the sample hermetic (no
  external services), so it runs in every environment exactly like samples 01
  and 14.
