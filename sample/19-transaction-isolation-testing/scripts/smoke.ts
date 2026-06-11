import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Module } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { Test, type TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { DrizzleModule, getDrizzleClientToken } from '@nest-native/drizzle';
import { createDatabase, type AppDatabase } from '../src/database';
import { InventoryRepository } from '../src/inventory/inventory.repository';
import { InventoryService } from '../src/inventory/inventory.service';
import { schema } from '../src/schema';

interface TestContext {
  service: InventoryService;
}

async function smoke(): Promise<void> {
  await rollbackKeepsDatabaseClean();
  await commitPersistsInsideOneIsolatedDatabase();
  await recreatePerTestStartsFromSeedState();
}

async function rollbackKeepsDatabaseClean(): Promise<void> {
  await usingTestContext('rollback', async ({ service }) => {
    assert.equal((await service.findWidget())?.quantity, 10);

    await assert.rejects(
      () => service.reserveWidgetAndFail(4),
      /forced rollback/,
    );

    assert.equal((await service.findWidget())?.quantity, 10);
    assert.deepEqual(await service.listEvents(), []);
    assert.equal(service.isTransactionActive(), false);
  });
}

async function commitPersistsInsideOneIsolatedDatabase(): Promise<void> {
  await usingTestContext('commit', async ({ service }) => {
    const result = await service.reserveWidget(3);

    assert.equal(result.transactionActive, true);
    assert.equal((await service.findWidget())?.quantity, 7);
    assert.deepEqual(
      (await service.listEvents()).map(event => ({
        delta: event.delta,
        reason: event.reason,
      })),
      [
        {
          delta: -3,
          reason: 'committed reservation',
        },
      ],
    );
    assert.equal(service.isTransactionActive(), false);
  });
}

async function recreatePerTestStartsFromSeedState(): Promise<void> {
  await usingTestContext('fresh', async ({ service }) => {
    assert.equal((await service.findWidget())?.quantity, 10);
    assert.deepEqual(await service.listEvents(), []);
    assert.equal(service.isTransactionActive(), false);
  });
}

async function usingTestContext(
  label: string,
  testBody: (context: TestContext) => Promise<void>,
): Promise<void> {
  const db = createDatabase(label);
  const moduleRef = await createTestingModule(db);

  try {
    await moduleRef.init();
    const service = moduleRef.get(InventoryService);
    await service.prepare();
    await testBody({ service });
  } finally {
    await moduleRef.close();
  }
}

async function createTestingModule(db: AppDatabase): Promise<TestingModule> {
  @Module({
    imports: [
      DrizzleModule.forRoot<AppDatabase>({
        schema,
        connection: db,
        shutdown: database => database.$client.close(),
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
    providers: [InventoryRepository, InventoryService],
  })
  class TestAppModule {}

  return Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
