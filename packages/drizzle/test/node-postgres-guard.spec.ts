import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { Injectable, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ClsPluginTransactional,
  TransactionHost,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { sql } from 'drizzle-orm';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ClsModule } from 'nestjs-cls';
import { guardNodePgPool } from '../client/node-postgres-guard';
import { Transactional } from '../decorators/transactional.decorator';
import { DrizzleModule } from '../drizzle.module';
import { getDrizzleClientToken } from '../tokens';

// drizzle-orm's node-postgres transaction() leaves the client it checks out of
// the pool without an `error` listener: a connection the server drops
// mid-transaction ended the process. DrizzleModule guards every node-postgres
// pool it is handed (see client/node-postgres-guard.ts).

let warns: string[];

/** Records warnings from here on. Compiling a Nest module resets the logger, so call it after. */
function captureWarns(): void {
  warns = [];
  Logger.overrideLogger({
    log: () => {},
    error: () => {},
    warn: (message: unknown) => warns.push(String(message)),
    debug: () => {},
    verbose: () => {},
  });
}

beforeEach(captureWarns);

afterEach(() => {
  Logger.overrideLogger(false);
});

/** A node-postgres Pool as the guard sees it: an emitter with `connect()` and `totalCount`. */
function fakePool(): EventEmitter & { connect: () => void; totalCount: number } {
  return Object.assign(new EventEmitter(), { connect: () => undefined, totalCount: 0 });
}

describe('guardNodePgPool', () => {
  it('leaves anything that is not a node-postgres pool alone', () => {
    // A single pg Client has connect() but no pool counters; libSQL and
    // better-sqlite3 clients have neither.
    for (const db of [
      undefined,
      null,
      {},
      { $client: undefined },
      { $client: null },
      { $client: { connect: () => undefined } },
      { $client: Object.assign(new EventEmitter(), { totalCount: 0 }) },
      { $client: { connect: () => undefined, totalCount: 0 } },
    ]) {
      assert.doesNotThrow(() => guardNodePgPool(db));
    }
    assert.deepEqual(warns, []);
  });

  it('gives every client the pool hands out one error listener that logs instead of crashing', () => {
    const pool = fakePool().on('error', () => undefined);
    guardNodePgPool({ $client: pool }, 'orders');
    // Guarding the same pool again (two modules sharing it) adds nothing.
    guardNodePgPool({ $client: pool }, 'orders');
    assert.equal(pool.listenerCount('acquire'), 1);

    const client = new EventEmitter();
    pool.emit('acquire', client);
    pool.emit('acquire', client);
    assert.equal(client.listenerCount('error'), 1);

    // Without a listener this emit throws, which is the process crash.
    assert.doesNotThrow(() =>
      client.emit('error', new Error('terminating connection due to administrator command')),
    );
    assert.deepEqual(warns, [
      'a node-postgres client of the "orders" Drizzle connection lost its connection: terminating connection due to administrator command; the statement in flight rejects and the pool discards the client',
    ]);
  });

  it('warns once when the pool itself has no error listener', () => {
    const pool = fakePool();
    guardNodePgPool({ $client: pool });
    guardNodePgPool({ $client: pool });
    assert.deepEqual(warns, [
      `the node-postgres Pool behind the "default" Drizzle connection has no 'error' listener; node-postgres crashes the process when an idle client loses its connection, so add pool.on('error', ...)`,
    ]);
  });

  it('DrizzleModule guards the pool behind every connection it registers', async () => {
    const pool = fakePool().on('error', () => undefined);
    const analytics = fakePool().on('error', () => undefined);
    const moduleRef = await Test.createTestingModule({
      imports: [
        DrizzleModule.forRoot({ connection: { $client: pool } }),
        DrizzleModule.forRootAsync({
          connectionName: 'analytics',
          useFactory: () => ({ connection: () => ({ $client: analytics }) }),
        }),
      ],
    }).compile();
    captureWarns();
    try {
      assert.equal(pool.listenerCount('acquire'), 1);
      assert.equal(analytics.listenerCount('acquire'), 1);
      const client = new EventEmitter();
      analytics.emit('acquire', client);
      client.emit('error', new Error('Connection terminated unexpectedly'));
      assert.match(warns[0] ?? '', /"analytics" Drizzle connection lost its connection/);
    } finally {
      await moduleRef.close();
    }
  });
});

describe('node-postgres connection loss (real PostgreSQL)', () => {
  const url = process.env.NEST_DRIZZLE_NATIVE_POSTGRES_URL;

  type PgTestDatabase = NodePgDatabase;
  type PgPool = import('pg').Pool;

  @Injectable()
  class LedgerService {
    constructor(
      private readonly txHost: TransactionHost<TransactionalAdapterDrizzleOrm<PgTestDatabase>>,
    ) {}

    /** Opens a transaction, has `admin` terminate its backend, then queries again. */
    @Transactional()
    async loseConnectionMidTransaction(admin: PgPool): Promise<void> {
      const result = await this.txHost.tx.execute(sql`select pg_backend_pid() as pid`);
      const [{ pid }] = (result as unknown as { rows: { pid: number }[] }).rows;
      await admin.query('select pg_terminate_backend($1)', [pid]);
      // Let the client see the termination while the transaction is open.
      await new Promise((resolve) => setTimeout(resolve, 200));
      await this.txHost.tx.execute(sql`select 1`);
    }

    @Transactional()
    async answer(): Promise<number> {
      const result = await this.txHost.tx.execute(sql`select 42 as answer`);
      return (result as unknown as { rows: { answer: number }[] }).rows[0].answer;
    }
  }

  it(
    'a connection lost inside @Transactional() rejects instead of crashing the process',
    { skip: url ? false : 'Set NEST_DRIZZLE_NATIVE_POSTGRES_URL to run this driver test' },
    async () => {
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: url });
      pool.on('error', () => undefined);
      const admin = new Pool({ connectionString: url });
      const moduleRef = await Test.createTestingModule({
        imports: [
          DrizzleModule.forRoot({ connection: drizzlePg({ client: pool }) }),
          ClsModule.forRoot({
            global: true,
            plugins: [
              new ClsPluginTransactional({
                adapter: new TransactionalAdapterDrizzleOrm({
                  drizzleInstanceToken: getDrizzleClientToken(),
                }),
              }),
            ],
          }),
        ],
        providers: [LedgerService],
      }).compile();
      await moduleRef.init();
      captureWarns();
      try {
        const ledger = moduleRef.get(LedgerService);
        // On an unguarded pool the process ends here, with "Unhandled 'error' event".
        await assert.rejects(ledger.loseConnectionMidTransaction(admin));
        assert.equal(pool.totalCount, 0, 'the pool discarded the broken client');
        assert.match(warns.join('\n'), /lost its connection: terminating connection due to administrator command/);
        // The pool recovers: the next transaction opens a fresh connection.
        assert.equal(await ledger.answer(), 42);
      } finally {
        await moduleRef.close();
        await pool.end();
        await admin.end();
      }
    },
  );
});
