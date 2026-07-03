import 'reflect-metadata';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import {
  primaryDatabasePath,
  replicaDatabasePath,
} from '../src/database';

interface AuditEventResponse {
  id: number;
  action: string;
  actor: string;
  createdAt: string;
}

const SNAPSHOT_ACTION = 'replica.snapshot.captured';
const WRITE_ACTION = 'orders.created';

async function smoke(): Promise<void> {
  // The HTTP driver is supplied explicitly via `ExpressAdapter` instead of
  // `NestFactory`'s default-driver auto-discovery. Auto-discovery resolves
  // `@nestjs/platform-express` relative to `@nestjs/core`, so it only succeeds
  // when both are hoisted together; constructing the adapter here resolves it
  // from this sample's own declared dependency, independent of workspace
  // hoisting.
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    logger: false,
  });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();

    // 1. Before any write, both sides hold only the replicated snapshot row.
    const initialReplicaView = await listEvents(baseUrl, '/events');
    assert.equal(initialReplicaView.length, 1);
    assert.equal(initialReplicaView[0]?.action, SNAPSHOT_ACTION);

    const initialPrimaryView = await listEvents(baseUrl, '/events/primary');
    assert.equal(initialPrimaryView.length, 1);
    assert.equal(initialPrimaryView[0]?.action, SNAPSHOT_ACTION);

    // 2. Routed write: `db.insert()` must go to the primary.
    const created = await createEvent(baseUrl, {
      action: WRITE_ACTION,
      actor: 'sample-21',
    });
    assert.equal(created.action, WRITE_ACTION);
    assert.equal(created.actor, 'sample-21');

    // 3. Routed read: `db.select()` must go to the replica. The replica is a
    //    frozen snapshot, so the freshly written row must NOT appear here. If
    //    reads hit the primary (routing broken), this view would contain the
    //    new row and the assertion would fail.
    const replicaViewAfterWrite = await listEvents(baseUrl, '/events');
    assert.equal(replicaViewAfterWrite.length, 1);
    assert.equal(replicaViewAfterWrite[0]?.action, SNAPSHOT_ACTION);
    assert.ok(
      replicaViewAfterWrite.every(event => event.action !== WRITE_ACTION),
      'routed read returned a row that only exists on the primary',
    );

    // 4. `$primary` read: bypasses replica routing and sees the new write.
    const primaryViewAfterWrite = await listEvents(baseUrl, '/events/primary');
    assert.equal(primaryViewAfterWrite.length, 2);
    assert.equal(primaryViewAfterWrite[0]?.action, WRITE_ACTION);
    assert.equal(primaryViewAfterWrite[0]?.id, created.id);
    assert.equal(primaryViewAfterWrite[1]?.action, SNAPSHOT_ACTION);
  } finally {
    await app.close();
  }

  // 5. File-level proof, independent of the HTTP app: the write landed in the
  //    primary database file and never touched the replica file.
  assertDatabaseFileContents();
}

function assertDatabaseFileContents(): void {
  const primaryActions = readActions(primaryDatabasePath);
  const replicaActions = readActions(replicaDatabasePath);

  assert.deepEqual(primaryActions, [SNAPSHOT_ACTION, WRITE_ACTION]);
  assert.deepEqual(replicaActions, [SNAPSHOT_ACTION]);
}

function readActions(databasePath: string): string[] {
  const sqlite = new Database(databasePath, { readonly: true });

  try {
    const rows = sqlite
      .prepare('SELECT action FROM audit_events ORDER BY id')
      .all() as Array<{ action: string }>;

    return rows.map(row => row.action);
  } finally {
    sqlite.close();
  }
}

async function listEvents(
  baseUrl: string,
  path: '/events' | '/events/primary',
): Promise<AuditEventResponse[]> {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.status, 200);
  return response.json() as Promise<AuditEventResponse[]>;
}

async function createEvent(
  baseUrl: string,
  body: { action: string; actor: string },
): Promise<AuditEventResponse> {
  const response = await fetch(`${baseUrl}/events`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  assert.equal(response.status, 201);
  return response.json() as Promise<AuditEventResponse>;
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
