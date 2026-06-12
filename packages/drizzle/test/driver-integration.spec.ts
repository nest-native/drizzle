import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { createClient, type Client } from '@libsql/client';
import Database from 'better-sqlite3';
import { Test, type TestingModule } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import {
  drizzle as drizzleBetterSqlite,
  type BetterSQLite3Database,
} from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleLibSql, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text as pgText } from 'drizzle-orm/pg-core';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { DrizzleRepository } from '../decorators/drizzle-repository.decorator';
import { InjectDrizzle } from '../decorators/inject-drizzle.decorator';
import { DrizzleModule } from '../drizzle.module';

const sqliteUsers = sqliteTable('driver_probe_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});
const sqliteSchema = { users: sqliteUsers };

const pgUsers = pgTable('driver_probe_users', {
  id: serial('id').primaryKey(),
  name: pgText('name').notNull(),
});
const pgSchema = { users: pgUsers };

const mysqlUsers = mysqlTable('driver_probe_users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});
const mysqlSchema = { users: mysqlUsers };

const databaseFiles: string[] = [];

type LibSqlTestDatabase = LibSQLDatabase<typeof sqliteSchema> & {
  $client: Client;
};
type BetterSqliteTestDatabase = BetterSQLite3Database<typeof sqliteSchema>;
type PgTestDatabase = ReturnType<typeof drizzlePg<typeof pgSchema>>;
type MysqlTestDatabase = ReturnType<typeof drizzleMysql<typeof mysqlSchema>>;

@DrizzleRepository()
class LibSqlUsersRepository {
  constructor(@InjectDrizzle() private readonly db: LibSqlTestDatabase) {}

  async reset(): Promise<void> {
    await this.db.run(sql`
      create table if not exists driver_probe_users (
        id integer primary key autoincrement,
        name text not null
      )
    `);
    await this.db.delete(sqliteUsers);
  }

  async create(name: string): Promise<void> {
    await this.db.insert(sqliteUsers).values({ name });
  }

  async names(): Promise<string[]> {
    const rows = await this.db
      .select({ name: sqliteUsers.name })
      .from(sqliteUsers)
      .orderBy(sqliteUsers.id);
    return rows.map(row => row.name);
  }
}

@DrizzleRepository()
class BetterSqliteUsersRepository {
  constructor(
    @InjectDrizzle() private readonly db: BetterSqliteTestDatabase,
  ) {}

  async reset(): Promise<void> {
    this.db.run(sql`
      create table if not exists driver_probe_users (
        id integer primary key autoincrement,
        name text not null
      )
    `);
    await this.db.delete(sqliteUsers);
  }

  async create(name: string): Promise<void> {
    await this.db.insert(sqliteUsers).values({ name });
  }

  async names(): Promise<string[]> {
    const rows = await this.db
      .select({ name: sqliteUsers.name })
      .from(sqliteUsers)
      .orderBy(sqliteUsers.id);
    return rows.map(row => row.name);
  }
}

@DrizzleRepository()
class PgUsersRepository {
  constructor(@InjectDrizzle() private readonly db: PgTestDatabase) {}

  async reset(): Promise<void> {
    await this.db.execute(sql`drop table if exists driver_probe_users`);
    await this.db.execute(sql`
      create table driver_probe_users (
        id serial primary key,
        name text not null
      )
    `);
  }

  async create(name: string): Promise<void> {
    await this.db.insert(pgUsers).values({ name });
  }

  async names(): Promise<string[]> {
    const rows = await this.db
      .select({ name: pgUsers.name })
      .from(pgUsers)
      .orderBy(pgUsers.id);
    return rows.map(row => row.name);
  }
}

@DrizzleRepository()
class MysqlUsersRepository {
  constructor(@InjectDrizzle() private readonly db: MysqlTestDatabase) {}

  async reset(): Promise<void> {
    await this.db.execute(sql`drop table if exists driver_probe_users`);
    await this.db.execute(sql`
      create table driver_probe_users (
        id int auto_increment primary key,
        name varchar(255) not null
      )
    `);
  }

  async create(name: string): Promise<void> {
    await this.db.insert(mysqlUsers).values({ name });
  }

  async names(): Promise<string[]> {
    const rows = await this.db
      .select({ name: mysqlUsers.name })
      .from(mysqlUsers)
      .orderBy(mysqlUsers.id);
    return rows.map(row => row.name);
  }
}

describe('Drizzle driver integration', () => {
  afterEach(async () => {
    await Promise.all(
      databaseFiles.splice(0).map(file => rm(file, { force: true })),
    );
  });

  it('works with a real libSQL client', async () => {
    const databaseFile = createDatabaseFile('libsql');
    const client = createClient({ url: `file:${databaseFile}` });
    const db = drizzleLibSql(client, { schema: sqliteSchema });
    let shutdownClient: LibSqlTestDatabase | undefined;

    const moduleRef = await createDriverModule({
      connection: db,
      repository: LibSqlUsersRepository,
      schema: sqliteSchema,
      shutdown: database => {
        shutdownClient = database;
        database.$client.close();
      },
    });

    try {
      await assertRepositoryRoundTrip(moduleRef, LibSqlUsersRepository);
    } finally {
      await moduleRef.close();
    }

    assert.equal(shutdownClient, db);
  });

  it('works with a real better-sqlite3 client', async () => {
    const databaseFile = createDatabaseFile('better-sqlite3');
    const sqlite = new Database(databaseFile);
    const db = drizzleBetterSqlite(sqlite, { schema: sqliteSchema });
    let shutdownClient: BetterSqliteTestDatabase | undefined;

    const moduleRef = await createDriverModule({
      connection: db,
      repository: BetterSqliteUsersRepository,
      schema: sqliteSchema,
      shutdown: database => {
        shutdownClient = database;
        sqlite.close();
      },
    });

    try {
      await assertRepositoryRoundTrip(moduleRef, BetterSqliteUsersRepository);
    } finally {
      await moduleRef.close();
    }

    assert.equal(shutdownClient, db);
    assert.equal(sqlite.open, false);
  });

  it(
    'works with a real PostgreSQL client',
    { skip: skipUnlessConfigured('NEST_DRIZZLE_NATIVE_POSTGRES_URL') },
    async () => {
      const connectionString = readConfiguredUrl(
        'NEST_DRIZZLE_NATIVE_POSTGRES_URL',
      );
      const { Pool } = require('pg') as {
        Pool: new (options: { connectionString: string }) => {
          end: () => Promise<void>;
        };
      };
      const pool = new Pool({ connectionString });
      const db = drizzlePg(pool, { schema: pgSchema });
      let shutdownClient: PgTestDatabase | undefined;

      const moduleRef = await createDriverModule({
        connection: db,
        repository: PgUsersRepository,
        schema: pgSchema,
        shutdown: async database => {
          shutdownClient = database;
          await pool.end();
        },
      });

      try {
        await assertRepositoryRoundTrip(moduleRef, PgUsersRepository);
      } finally {
        await moduleRef.close();
      }

      assert.equal(shutdownClient, db);
    },
  );

  it(
    'works with a real MySQL client',
    { skip: skipUnlessConfigured('NEST_DRIZZLE_NATIVE_MYSQL_URL') },
    async () => {
      const connectionString = readConfiguredUrl(
        'NEST_DRIZZLE_NATIVE_MYSQL_URL',
      );
      const mysql = require('mysql2/promise') as {
        createPool: (url: string) => unknown;
      };
      const pool = mysql.createPool(connectionString) as {
        end: () => Promise<void>;
      };
      const db = drizzleMysql(pool as never, {
        schema: mysqlSchema,
        mode: 'default',
      });
      let shutdownClient: MysqlTestDatabase | undefined;

      const moduleRef = await createDriverModule({
        connection: db,
        repository: MysqlUsersRepository,
        schema: mysqlSchema,
        shutdown: async database => {
          shutdownClient = database;
          await pool.end();
        },
      });

      try {
        await assertRepositoryRoundTrip(moduleRef, MysqlUsersRepository);
      } finally {
        await moduleRef.close();
      }

      assert.equal(shutdownClient, db);
    },
  );
});

async function createDriverModule<
  TClient,
  TSchema extends Record<string, unknown>,
  TRepository,
>(
  options: {
    connection: TClient;
    repository: new (...args: any[]) => TRepository;
    schema: TSchema;
    shutdown: (client: TClient) => void | Promise<void>;
  },
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      DrizzleModule.forRoot({
        connection: options.connection,
        schema: options.schema,
        shutdown: options.shutdown,
      }),
      DrizzleModule.forFeature([options.repository]),
    ],
  }).compile();
}

async function assertRepositoryRoundTrip<TRepository extends {
  reset: () => Promise<void>;
  create: (name: string) => Promise<void>;
  names: () => Promise<string[]>;
}>(
  moduleRef: TestingModule,
  repository: new (...args: any[]) => TRepository,
): Promise<void> {
  const usersRepository = moduleRef.get(repository);

  await usersRepository.reset();
  await usersRepository.create('Ada');
  await usersRepository.create('Grace');

  assert.deepEqual(await usersRepository.names(), ['Ada', 'Grace']);
}

function createDatabaseFile(driver: string): string {
  const databaseFile = join(
    tmpdir(),
    `nest-native-drizzle-${driver}-${process.pid}-${Date.now()}-${Math.random()}.db`,
  );
  databaseFiles.push(databaseFile);
  return databaseFile;
}

function skipUnlessConfigured(environmentVariable: string): false | string {
  return process.env[environmentVariable]
    ? false
    : `Set ${environmentVariable} to run this driver test`;
}

function readConfiguredUrl(environmentVariable: string): string {
  const url = process.env[environmentVariable];

  assert.ok(url, `${environmentVariable} must be configured`);

  return url;
}
