import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { createClient, type Client } from '@libsql/client';
import { Injectable, type Type } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ClsPluginTransactional,
  TransactionHost,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { sql } from 'drizzle-orm';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ClsModule } from 'nestjs-cls';
import { DrizzleRepository } from '../decorators/drizzle-repository.decorator';
import { InjectDrizzle } from '../decorators/inject-drizzle.decorator';
import { Transactional } from '../decorators/transactional.decorator';
import { DrizzleModule } from '../drizzle.module';
import { getDrizzleClientToken } from '../tokens';

const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});
const schema = { users };
const databaseFiles: string[] = [];

type TestDatabase = LibSQLDatabase<typeof schema> & {
  $client: Client;
};
type DrizzleTransactionalAdapter = TransactionalAdapterDrizzleOrm<TestDatabase>;

@DrizzleRepository()
class RealUsersRepository {
  constructor(@InjectDrizzle() private readonly db: TestDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      create table users (
        id integer primary key autoincrement,
        name text not null
      )
    `);
  }

  async create(name: string): Promise<void> {
    await this.db.insert(users).values({ name });
  }

  async names(): Promise<string[]> {
    const rows = await this.db
      .select({ name: users.name })
      .from(users)
      .orderBy(users.id);
    return rows.map(row => row.name);
  }
}

@Injectable()
class TransactionalUsersService {
  constructor(
    private readonly txHost: TransactionHost<DrizzleTransactionalAdapter>,
  ) {}

  @Transactional()
  async createAndCommit(name: string): Promise<boolean> {
    await this.txHost.tx.insert(users).values({ name });
    return this.txHost.isTransactionActive();
  }

  @Transactional()
  async createAndRollback(name: string): Promise<void> {
    await this.txHost.tx.insert(users).values({ name });
    throw new Error('rollback');
  }
}

describe('Drizzle integration', () => {
  let moduleRef: TestingModule | undefined;

  afterEach(async () => {
    await moduleRef?.close();
    moduleRef = undefined;
    await Promise.all(
      databaseFiles.splice(0).map(file => rm(file, { force: true })),
    );
  });

  it('executes repository queries against a real Drizzle libSQL client', async () => {
    moduleRef = await createIntegrationModule();
    const repository = moduleRef.get(RealUsersRepository);

    await repository.migrate();
    await repository.create('Ada');
    await repository.create('Grace');

    assert.deepEqual(await repository.names(), ['Ada', 'Grace']);
  });

  it('uses the real CLS Drizzle transaction adapter for commit and rollback', async () => {
    moduleRef = await createIntegrationModule([TransactionalUsersService]);
    const repository = moduleRef.get(RealUsersRepository);
    const service = moduleRef.get(TransactionalUsersService);

    await repository.migrate();

    await assert.rejects(
      () => service.createAndRollback('Rolled back'),
      /rollback/,
    );
    assert.deepEqual(await repository.names(), []);

    assert.equal(await service.createAndCommit('Committed'), true);
    assert.deepEqual(await repository.names(), ['Committed']);
  });
});

async function createIntegrationModule(
  providers: Type[] = [],
): Promise<TestingModule> {
  const databaseFile = join(
    tmpdir(),
    `nest-native-drizzle-${process.pid}-${Date.now()}-${Math.random()}.db`,
  );
  databaseFiles.push(databaseFile);
  const client = createClient({ url: `file:${databaseFile}` });
  const db = drizzle(client, { schema });

  const module = await Test.createTestingModule({
    imports: [
      DrizzleModule.forRoot({
        schema,
        connection: db,
        shutdown: database => database.$client.close(),
      }),
      DrizzleModule.forFeature([RealUsersRepository]),
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
    providers,
  }).compile();

  await module.init();
  return module;
}
