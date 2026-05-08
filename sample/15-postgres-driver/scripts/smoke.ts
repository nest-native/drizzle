import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';

interface AuditEventResponse {
  id: number;
  action: string;
  actor: string;
  createdAt: string;
}

async function smoke(): Promise<void> {
  if (!process.env.NEST_DRIZZLE_NATIVE_POSTGRES_URL) {
    console.log(
      'Skipping PostgreSQL smoke: NEST_DRIZZLE_NATIVE_POSTGRES_URL is not set.',
    );
    return;
  }

  const { AppModule } = await import('../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    assert.deepEqual(await listEvents(baseUrl), []);

    const created = await createEvent(baseUrl, {
      action: 'driver.postgres.created',
      actor: 'sample-15',
    });

    assert.equal(created.action, 'driver.postgres.created');
    assert.equal(created.actor, 'sample-15');

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
