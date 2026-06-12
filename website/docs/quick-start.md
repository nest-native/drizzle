# Quick Start

Install the package and Drizzle:

```bash
npm i @nest-native/drizzle drizzle-orm
```

Install the Nest peers:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

Install the database driver your application uses:

```bash
npm i pg
```

## Register A Drizzle Client

This example uses PostgreSQL, but the same pattern works with any Drizzle
client.

```ts
import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DrizzleModule } from '@nest-native/drizzle';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

@Module({
  imports: [
    DrizzleModule.forRoot({
      schema,
      connection: drizzle(pool, { schema }),
      shutdown: () => pool.end(),
    }),
  ],
})
export class AppModule {}
```

`schema` is stored as-is. The package does not transform it or require class
entities.

## Inject The Client

```ts
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nest-native/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  findMany() {
    return this.db.query.users.findMany();
  }
}
```

## Add A Repository

Repositories are plain provider classes. They are useful when query logic grows
beyond one service method, but they should still expose explicit Drizzle-shaped
behavior.

```ts
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

@DrizzleRepository()
export class UsersRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  findById(id: string) {
    return this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });
  }
}
```

Register repositories through a feature module:

```ts
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { UsersRepository } from './users.repository';

@Module({
  imports: [DrizzleModule.forFeature([UsersRepository])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## Async Configuration

Use `forRootAsync()` when the connection depends on other providers.

```ts
DrizzleModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const pool = new Pool({
      connectionString: config.getOrThrow('DATABASE_URL'),
    });

    return {
      schema,
      connection: drizzle(pool, { schema }),
      shutdown: () => pool.end(),
    };
  },
});
```

## Next Steps

- Use [Repositories](repositories.md) to structure query code.
- Use [Transactions](transactions.md) for CLS-backed transactions.
- Use [Testing](testing.md) for unit and integration test patterns.
- Use [Samples](samples/index.md) for runnable examples of each feature in
  isolation.
