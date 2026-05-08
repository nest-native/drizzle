# nest-drizzle-native

<p align="center">Nest-native Drizzle ORM integration with dependency injection, repositories, and transaction decorators.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nest-drizzle-native"><img src="https://img.shields.io/npm/v/nest-drizzle-native.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/nest-drizzle-native"><img src="https://img.shields.io/npm/dm/nest-drizzle-native.svg" alt="NPM Downloads" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Package License" /></a>
  <img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg" alt="Test Coverage" />
  <a href="https://rodrigobnogueira.github.io/nest-drizzle-native/"><img src="https://img.shields.io/badge/docs-nest--drizzle--native-0f766e.svg" alt="Documentation" /></a>
</p>

## What This Is

`nest-drizzle-native` is a community NestJS integration for applications that
want Drizzle ORM with Nest-style modules, dependency injection, repository
classes, lifecycle cleanup, and transaction decorators without hiding Drizzle's
SQL-first query builder.

The documentation is the canonical source of truth for usage guides and support
policy:

- [Introduction](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/introduction)
- [Quick Start](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/quick-start)
- [Repositories](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/repositories)
- [Transactions](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/transactions)
- [Testing](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/testing)
- [Samples](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/samples/)
- [API Reference](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/api-reference)
- [Quality and CI](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/quality-and-ci)
- [Contributing](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/contributing)
- [Support Policy](https://rodrigobnogueira.github.io/nest-drizzle-native/docs/support-policy)

## Why Use It

`nest-drizzle-native` keeps Drizzle explicit while giving Nest applications a
native integration surface:

- Module setup via `DrizzleModule.forRoot()` and `DrizzleModule.forRootAsync()`
- Direct client injection through `@InjectDrizzle()`
- Repository classes with `@DrizzleRepository()` and `DrizzleModule.forFeature()`
- Named connections for multi-database applications
- Shutdown hooks for drivers owned by the Nest module
- Transaction decorator bridges for `@nestjs-cls/transactional`
- Testing helpers for isolated modules and repository mocks

## Compatibility

| Runtime | Supported line |
| --- | --- |
| Node.js | `>=20` |
| NestJS | `11.x` |
| Drizzle ORM | `>=0.30.0 <2.0.0` |
| Transaction bridge | `@nestjs-cls/transactional`, optional |
| Drivers | Bring the Drizzle driver your app uses |

For peer dependency policy and API stability, see
[website/docs/support-policy.md](website/docs/support-policy.md).

## Repository Layout

This repository contains:

- `packages/drizzle`: the `nest-drizzle-native` integration package
- `website/docs`: Docusaurus documentation for setup, APIs, samples, testing, quality gates, and support
- `sample`: focused runnable examples for each supported feature
- `scripts`: release, quality, coverage, and report-generation helpers
- `CONTRIBUTING.md`: contributor workflow, including sample/library PR separation

Samples are part of the public learning path. The set includes the full
showcase plus focused examples for direct client injection, repositories, async
configuration, named connections, transactions, Nest DTO validation, optional
Drizzle-Zod validation, driver setup, testing, raw SQL, and Swagger.

## Installation

```bash
npm i nest-drizzle-native drizzle-orm
```

Required peers:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

Install the Drizzle driver your app actually uses:

```bash
npm i pg
# or mysql2, better-sqlite3, @libsql/client, etc.
```

For `@Transactional()` and `@InjectTransaction()`, install and configure the CLS
transaction stack:

```bash
npm i @nestjs-cls/transactional
```

## Quick Start

Define schemas with standard Drizzle syntax. The library receives the schema
object as-is and does not introduce class entities.

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

Use repositories as structured homes for query code while keeping Drizzle
explicit.

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
want to keep a connection scoped to one module boundary.

## Transactions

`@Transactional()` and `@InjectTransaction()` are bridged to
`@nestjs-cls/transactional`. This keeps transaction context management on the
well-tested CLS transaction stack instead of introducing a second
AsyncLocalStorage implementation.

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

See [website/docs/transactions.md](website/docs/transactions.md) for the required CLS setup.

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

Prefer real Drizzle clients for integration tests that prove SQL behavior,
transactions, migrations, or driver-specific assumptions. See
[website/docs/testing.md](website/docs/testing.md).

## Quality Gates

The repository starts with the same review posture as `nest-trpc-native` while
using `node:test` and `c8` for this package:

- package build and typecheck on Node.js 20 and 22
- coverage with `c8`, enforced at 100% for statements, branches, functions, and lines
- sticky PR comments for coverage, test performance, and cognitive complexity
- cognitive complexity enforcement with SonarJS threshold `15`
- package tarball validation
- sample version sync and workspace resolution validation
- dedicated CI sample validation
- supply-chain audit for high-severity issues

Run the local gate with:

```bash
npm run ci
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history and unreleased user-facing
changes.

## Roadmap

The package is intentionally small. The current public surface focuses on:

- `DrizzleModule` registration, including async options and named connections
- `@InjectDrizzle()` and repository providers for Nest-friendly query classes
- transaction decorator bridges for applications that use CLS
- testing helpers that keep unit tests override-friendly
- focused samples for validation, error mapping, transactions, Swagger, and
  driver-owned lifecycle setup

Intentional choices:

- DTO classes with `ValidationPipe` remain the canonical Nest-native HTTP
  validation path.
- Zod and `drizzle-zod` stay optional and app-owned. The bridge sample documents
  the pattern without adding package-level magic.
- Driver clients, pools, and shutdown behavior stay in application code; the
  module receives a ready Drizzle client.

Possible future work:

- Additional focused samples for new drivers or public features as they land.
- A tiny optional helper only if repeated samples prove it removes real
  boilerplate without weakening the Nest-native API.

## Philosophy

This library should feel native in NestJS projects while staying faithful to
Drizzle. Repositories organize query code; they do not replace Drizzle's query
builder, `sql` template, schema definitions, or type inference.
