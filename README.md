# nest-drizzle-native

Nest-native Drizzle ORM integration for applications that want NestJS dependency
injection, repository structure, and transaction decorators without hiding
Drizzle's SQL-first query builder.

This repository is in its first implementation phase. The current package
provides the core module API, injection decorators, repository registration,
transaction decorator bridges, testing helpers, quality gates, and release
checks. Driver-specific samples, Swagger generation helpers, and full transaction
showcases are intentionally next.

## Install

```bash
npm install nest-drizzle-native drizzle-orm @nestjs/common @nestjs/core reflect-metadata rxjs
```

Install the Drizzle driver your app actually uses, such as `pg`, `mysql2`,
`better-sqlite3`, or `@libsql/client`.

For `@Transactional()` support, install and configure
`@nestjs-cls/transactional` in your application.

## Quick Start

Define schemas with standard Drizzle syntax. `nest-drizzle-native` receives the
schema object as-is and does not introduce class entities.

```ts
import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DrizzleModule } from 'nest-drizzle-native';
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

Inject the client directly when a service needs the full Drizzle surface.

```ts
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from 'nest-drizzle-native';
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

Use repositories as structured homes for queries while keeping Drizzle explicit.

```ts
import { Module } from '@nestjs/common';
import {
  DrizzleModule,
  DrizzleRepository,
  InjectDrizzle,
} from 'nest-drizzle-native';
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

@Module({
  imports: [DrizzleModule.forFeature([UsersRepository])],
  exports: [UsersRepository],
})
export class UsersModule {}
```

## Async Configuration

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

Named connections are supported for multi-database applications.

```ts
DrizzleModule.forRoot({
  connectionName: 'analytics',
  schema: analyticsSchema,
  connection: analyticsDb,
});

constructor(@InjectDrizzle('analytics') private readonly analytics: AnalyticsDb) {}
```

Root connections are global by default so feature modules can register
repositories with `DrizzleModule.forFeature()`. Set `isGlobal: false` when you
want to keep a connection scoped to a single module boundary.

## Transactions

`@Transactional()` and `@InjectTransaction()` are intentionally bridged to
`@nestjs-cls/transactional`. This keeps transaction context management on the
well-tested CLS transaction stack instead of introducing a second AsyncLocalStorage
implementation.

```ts
import { Injectable } from '@nestjs/common';
import { Transactional } from 'nest-drizzle-native';

@Injectable()
export class BillingService {
  @Transactional()
  async billCustomer(customerId: string) {
    // Calls across injected services can participate in the same transaction
    // once @nestjs-cls/transactional is configured for Drizzle.
  }
}
```

## Testing

```ts
import { Test } from '@nestjs/testing';
import {
  DrizzleTestModule,
  createDrizzleMockClient,
} from 'nest-drizzle-native';

const db = createDrizzleMockClient({
  query: {
    users: {
      findMany: () => [{ id: 'user_1' }],
    },
  },
});

const module = await Test.createTestingModule({
  imports: [DrizzleTestModule.forRoot({ client: db })],
}).compile();
```

## Quality Gates

The repository starts with the same quality posture as `nest-trpc-native`:

- package build and typecheck on Node.js 20 and 22
- coverage with `c8`
- cognitive complexity enforcement with SonarJS threshold `15`
- cognitive complexity JSON reports
- package tarball validation
- supply-chain audit for high-severity issues
- GitHub Actions summaries for coverage and test-step duration

Run the local gate with:

```bash
npm run ci
```

## Roadmap

- `sample/00-showcase` with feature modules, repositories, services,
  controllers, request-scoped providers, enhancers, Express/Fastify mains,
  seeding, and Swagger.
- Focused samples for validation, transactions, named connections, testing, and
  driver differences.
- Drizzle-Zod and Swagger helpers for single-source-of-truth DTO/OpenAPI flows.
- Driver integration suites for PostgreSQL, MySQL, SQLite, and libSQL.

## Philosophy

This library should feel native in NestJS projects while staying faithful to
Drizzle. Repositories organize query code; they do not replace Drizzle's query
builder, `sql` template, schema definitions, or type inference.
