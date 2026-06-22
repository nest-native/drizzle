import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

interface AuditEventResponse {
  id: number;
  action: string;
  actor: string;
  createdAt: string;
}

async function smoke(): Promise<void> {
  if (!process.env.NEST_DRIZZLE_NATIVE_MYSQL_URL) {
    console.log(
      'Skipping MySQL smoke: NEST_DRIZZLE_NATIVE_MYSQL_URL is not set.',
    );
    return;
  }

  const { AppModule } = await import('../src/app.module');
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
    assert.deepEqual(await listEvents(baseUrl), []);

    const created = await createEvent(baseUrl, {
      action: 'driver.mysql.created',
      actor: 'sample-16',
    });

    assert.equal(created.action, 'driver.mysql.created');
    assert.equal(created.actor, 'sample-16');

    const events = await listEvents(baseUrl);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.id, created.id);
  } finally {
    await app.close();
  }
}

async function listEvents(baseUrl: string): Promise<AuditEventResponse[]> {
  const response = await fetch(`${baseUrl}/events`);
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
