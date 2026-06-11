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

## Testing Transactions

Use real Drizzle clients for transaction tests. Mocking a transaction decorator
or mock client can prove that a service calls a method, but it cannot prove
commit, rollback, isolation, or driver adapter behavior.
