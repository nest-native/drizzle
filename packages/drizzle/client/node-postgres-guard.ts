import { Logger } from '@nestjs/common';
import { DEFAULT_DRIZZLE_CONNECTION_NAME } from '../constants';

/**
 * A node-postgres `Pool`, recognized by shape (`connect()` plus the pool's
 * `totalCount` counter) so this module never loads `pg`. A single `Client`
 * has no `totalCount`; it is not a pool.
 */
interface NodePgPool {
  connect(): unknown;
  totalCount: number;
  on(event: 'acquire', listener: (client: NodePgClient) => void): unknown;
  listenerCount(event: 'error'): number;
}

interface NodePgClient {
  on(event: 'error', listener: (error: Error) => void): unknown;
}

const isNodePgPool = (value: unknown): value is NodePgPool =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Partial<NodePgPool>).connect === 'function' &&
  typeof (value as Partial<NodePgPool>).totalCount === 'number' &&
  typeof (value as Partial<NodePgPool>).on === 'function' &&
  typeof (value as Partial<NodePgPool>).listenerCount === 'function';

const logger = new Logger('DrizzleModule');
const guardedPools = new WeakSet<object>();
const guardedClients = new WeakSet<object>();

/**
 * Keeps a dropped Postgres connection from crashing the process when `db` is a
 * Drizzle database on a node-postgres `Pool`; anything else is left alone.
 *
 * drizzle-orm's node-postgres `transaction()` checks a client out of the pool
 * and adds no `error` listener to it, and pg-pool removes its own while the
 * client is checked out. A connection the server drops mid-transaction (a
 * failover, a restart, `pg_terminate_backend`, `idle_in_transaction_session_timeout`)
 * then emits `error` on a client nobody listens to, and Node ends the process,
 * whatever listens on the pool. Every `@Transactional()` body on such a pool
 * runs through that `transaction()`.
 *
 * The guard gives each client the pool hands out an `error` listener that logs
 * a warning: the transaction rejects instead, and the pool discards the broken
 * client. It also warns once when the pool itself has no `error` listener,
 * which node-postgres requires: without one, a connection an idle client loses
 * still crashes the process.
 *
 * `DrizzleModule` applies it to every connection it registers. Guarding the
 * same pool again is a no-op.
 */
export function guardNodePgPool(
  db: unknown,
  connectionName = DEFAULT_DRIZZLE_CONNECTION_NAME,
): void {
  const pool = (db as { $client?: unknown } | null | undefined)?.$client;
  if (!isNodePgPool(pool) || guardedPools.has(pool)) return;
  guardedPools.add(pool);
  // 'acquire' fires on every checkout, before the caller gets the client, so it
  // also reaches clients the pool opened before this guard.
  pool.on('acquire', (client) => {
    if (guardedClients.has(client)) return;
    guardedClients.add(client);
    client.on('error', (error) => {
      logger.warn(
        `a node-postgres client of the "${connectionName}" Drizzle connection lost its connection: ${error.message}; the statement in flight rejects and the pool discards the client`,
      );
    });
  });
  if (pool.listenerCount('error') === 0) {
    logger.warn(
      `the node-postgres Pool behind the "${connectionName}" Drizzle connection has no 'error' listener; node-postgres crashes the process when an idle client loses its connection, so add pool.on('error', ...)`,
    );
  }
}
