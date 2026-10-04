# Transactions

`@nest-native/drizzle` bridges transaction decorators to
`@nestjs-cls/transactional`. It does not implement a separate transaction
context. That keeps transaction state on the same CLS stack used by other Nest
integrations.

Install the transaction peer:

```bash
npm i @nestjs-cls/transactional
```

Install the adapter for your Drizzle driver when needed. For example, the test
suite uses:

```bash
npm i @nestjs-cls/transactional-adapter-drizzle-orm
```

## Configure CLS

The exact adapter configuration depends on your driver. The important part is
that the adapter points at the same Drizzle client token used by
`DrizzleModule`.

```ts
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { getDrizzleClientToken } from '@nest-native/drizzle';

@Module({
  imports: [
    DrizzleModule.forRoot({
      schema,
      connection: db,
    }),
    ClsModule.forRoot({
      global: true,
      plugins: [
        new ClsPluginTransactional({
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: getDrizzleClientToken(),
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

For named connections, pass the same connection name to `getDrizzleClientToken()`.

```ts
getDrizzleClientToken('analytics')
```

## Use The Decorator

```ts
import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Transactional } from '@nest-native/drizzle';

@Injectable()
export class UsersService {
  constructor(private readonly txHost: TransactionHost<AppTxAdapter>) {}

  @Transactional()
  async createUser(name: string) {
    await this.txHost.tx.insert(users).values({ name });
  }
}
```

## Rollback Behavior

Rollback behavior is owned by the configured CLS transaction adapter. In the
package integration tests, a thrown error inside a `@Transactional()` method
rolls back the real libSQL Drizzle transaction, and a successful method commits.

## Connection Loss On node-postgres

On a node-postgres `Pool`, drizzle-orm's `transaction()`, which every
`@Transactional()` method runs through, checks a client out of the pool and
gives it no `error` listener. When the database drops that connection while
the transaction is open (a failover, a restart, `pg_terminate_backend`,
`idle_in_transaction_session_timeout`), node-postgres emits `error` on the
client and Node ends the process, even when the pool has an `error` listener.

`DrizzleModule` closes that gap for every connection it registers. When the
Drizzle client runs on a node-postgres pool, each client the pool hands out
gets an `error` listener that logs a warning, so the transaction rejects
instead and the pool discards the broken client. The module also warns once at
startup when the pool has no `error` listener of its own. node-postgres
requires one, because it reports a connection an idle client loses on the
pool:

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (error) => logger.warn(`idle Postgres client: ${error.message}`));
```

Two drizzle-orm behaviours remain until drizzle-orm fixes them:

- The rejection carries drizzle's failed `rollback` (`Failed query: rollback`)
  rather than the connection error. The module's warning logs the real cause.
- A connection lost while `BEGIN` runs is never returned to the pool.

A pool you use outside `DrizzleModule` needs the same per-client listener:
`pool.on('connect', (client) => client.on('error', handleError))`.

## Testing Transactions

Use real Drizzle clients for transaction tests. Mocking a transaction decorator
or mock client can prove that a service calls a method, but it cannot prove
commit, rollback, isolation, or driver adapter behavior.
