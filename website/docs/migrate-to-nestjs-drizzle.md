---
title: Migrate to @nestjs/drizzle
description: Move from @nest-native/drizzle to NestJS's official Drizzle module.
---

# Migrate to `@nestjs/drizzle`

NestJS now ships an official Drizzle module,
[`@nestjs/drizzle`](https://docs.nestjs.com/data/drizzle). It covers what most
applications used `@nest-native/drizzle` for, so this package is **deprecated**:
0.5.2 is its last release, and the repository is archived. Existing installs
keep working, but there will be no further fixes. Move to the official module.

Most of the move is renaming. The official module keeps the names you already
use (`DrizzleModule.forRoot()`, `forRootAsync()`, `@InjectDrizzle()`), drops the
repository layer, and leaves transactions to `@nestjs-cls/transactional`, which
this package only ever bridged to.

## Before you start

- **Node.js.** `@nestjs/drizzle` is ESM-only. A CommonJS application loads it
  through Node's `require(esm)`, which is unflagged from Node 20.19 and 22.12.
- **Drizzle ORM.** It supports `drizzle-orm` 0.35 and later, and the v1 release
  candidates.
- **NestJS.** It supports NestJS 11 and 12, like this package.

```bash
npm uninstall @nest-native/drizzle
npm install @nestjs/drizzle
```

## What changes

| `@nest-native/drizzle` | `@nestjs/drizzle` |
| --- | --- |
| `DrizzleModule.forRoot({ schema, connection: db })` | `DrizzleModule.forRoot({ db })` |
| `connection: () => createDb()` (a factory) | `DrizzleModule.forRootAsync({ useFactory: () => ({ db: createDb() }) })` |
| `connectionName: 'analytics'` | `name: 'analytics'` |
| `shutdown: (client) => …` (closing is opt-in) | `autoCloseConnection` (closing is **on by default**; see below) |
| `isGlobal` | always global |
| `@InjectDrizzle(name?)` | `@InjectDrizzle(name?)`, unchanged |
| `getDrizzleClientToken(name?)` | `getDrizzleToken(name?)` |
| `@DrizzleRepository()` + `DrizzleModule.forFeature([Repo])` | `@Injectable()` + the module's `providers` (and `exports` when shared) |
| `@Transactional()`, `@InjectTransaction()` | the same decorators, imported from `@nestjs-cls/transactional` |
| `DrizzleTestModule`, `createDrizzleMockClient()` | override `getDrizzleToken()` in `Test.createTestingModule()` |
| `mapDrizzleError()`, `DrizzleExceptionFilter` | no equivalent; copy them into your application (see below) |

`getDrizzleSchemaToken()`, `getDrizzleOptionsToken()`,
`getDrizzleConnectionManagerToken()` and `getDrizzleTransactionToken()` have no
counterpart. The schema lives on the database (`drizzle(client, { schema })`)
rather than in its own provider.

## Registering the database

```ts
// Before
import { DrizzleModule } from '@nest-native/drizzle';

DrizzleModule.forRoot({ schema, connection: db });

// After
import { DrizzleModule } from '@nestjs/drizzle';

DrizzleModule.forRoot({ db });
```

The official module can also create the database for you from the driver's
`drizzle()` function and a connection:

```ts
import { drizzle } from 'drizzle-orm/node-postgres';

DrizzleModule.forRoot({
  drizzle,
  connection: process.env.DATABASE_URL,
  schema,
});
```

### Shutdown is now automatic

This package closed a client only when you passed `shutdown`. The official
module closes `db.$client` on application shutdown by default (`end()` for
pools, `close()` for embedded drivers such as better-sqlite3). Remove your
`shutdown` callback. If the same `db` is shared by several Nest applications
(for example, across e2e test files), pass `autoCloseConnection: false` and
close it yourself, or the first application to shut down closes it for the
others.

## Repositories

There is no repository decorator or `forFeature()`. A repository is a plain
provider:

```ts
// Before
@DrizzleRepository()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}
}

@Module({ imports: [DrizzleModule.forFeature([UsersRepository])] })
export class UsersModule {}

// After
@Injectable()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}
}

@Module({ providers: [UsersRepository], exports: [UsersRepository] })
export class UsersModule {}
```

`forFeature()` exported the repositories it registered, so add them to
`exports` wherever another module injects them.

## Transactions

`@Transactional()` and `@InjectTransaction()` were thin bridges to
`@nestjs-cls/transactional`. Import them from there, and point the adapter at
the official token:

```ts
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';

@Module({
  imports: [
    DrizzleModule.forRoot({ db }),
    ClsModule.forRoot({
      global: true,
      plugins: [
        new ClsPluginTransactional({
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: getDrizzleToken(),
          }),
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

```ts
// Before
import { InjectTransaction, Transactional } from '@nest-native/drizzle';

// After
import { InjectTransaction, Transactional } from '@nestjs-cls/transactional';
```

Without `@nestjs-cls/transactional` installed, this package's
`@InjectTransaction()` fell back to injecting the database itself; use
`@InjectDrizzle()` for that.

## Libraries that take a Drizzle token

`@nest-native/messaging`, `@nest-native/jobs`, `@nest-native/lockout` and
`@nest-native/cache` take the database as `drizzleInstanceToken`. Pass
`getDrizzleToken()` where you passed `getDrizzleClientToken()`. Nothing else
changes; the [reference app](https://github.com/nest-native/reference-app) runs
all four on the official module.

## Testing

```ts
const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(getDrizzleToken())
  .useValue(db)
  .compile();
```

For anything that runs real SQL, prefer a real database, such as PGlite or a
SQLite file, registered with `DrizzleModule.forRoot({ db })`.

## Error mapping

The official module has no counterpart to `mapDrizzleError()`,
`describeDrizzleError()`, the `is*ConstraintError()` predicates, or
`DrizzleExceptionFilter`. They depend only on `@nestjs/common` and
`@nestjs/core`, so copy
[`errors/`](https://github.com/nest-native/drizzle/tree/main/packages/drizzle/errors)
into your application (MIT).

## Postgres: a connection dropped mid-transaction

`@nest-native/drizzle` 0.5.1 gave every node-postgres pool client an `error`
listener. drizzle-orm's node-postgres `transaction()` checks a client out of
the pool without one, so a connection the server drops mid-transaction (a
failover, a restart, `pg_terminate_backend()`) ends the process
([drizzle-orm#6437](https://github.com/drizzle-team/drizzle-orm/issues/6437)).
The official module listens for errors on the pool, which covers idle
connections, but not yet on a connection that is checked out
([nestjs/drizzle#30](https://github.com/nestjs/drizzle/pull/30) adds it). Until
it does, give each client an `error` listener yourself:

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (error) => logger.warn(`idle client lost: ${error.message}`));
// 'connect' fires once per new client, before its first checkout.
pool.on('connect', (client) => {
  client.on('error', (error) => logger.warn(`client lost: ${error.message}`));
});

DrizzleModule.forRoot({ db: drizzle(pool, { schema }) });
```

Attach it on `connect`, not `acquire`: pg-pool emits `acquire` before it removes
its own idle listener, so an `acquire`-time check for "no listener yet" never
fires.
