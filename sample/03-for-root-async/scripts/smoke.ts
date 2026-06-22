import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DatabaseLifecycleTracker } from '../src/config/database-lifecycle.tracker';
import { AppModule } from '../src/app.module';

async function smoke(): Promise<void> {
  // The HTTP driver is supplied explicitly via `ExpressAdapter` instead of
  // `NestFactory`'s default-driver auto-discovery. Auto-discovery resolves
  // `@nestjs/platform-express` relative to `@nestjs/core`, so it only succeeds
  // when both are hoisted together; constructing the adapter here resolves it
  // from this sample's own declared dependency, independent of workspace
  // hoisting.
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    abortOnError: false,
    logger: false,
  });
  await app.listen(0, '127.0.0.1');

  const tracker = app.get(DatabaseLifecycleTracker);

  try {
    const baseUrl = await app.getUrl();
    const before = await getStatus(baseUrl);
    const event = await recordEvent(baseUrl, 'created through forRootAsync');
    const after = await getStatus(baseUrl);

    assert.equal(tracker.factoryCalls, 1);
    assert.equal(event.message, 'created through forRootAsync');
    assert.equal(after.events, before.events + 1);
    assert.equal(after.source, 'local');
  } finally {
    await app.close();
  }

  assert.equal(tracker.shutdownCalls, 1);
}

async function getStatus(
  baseUrl: string,
): Promise<{ events: number; source: string }> {
  const response = await fetch(`${baseUrl}/system`);
  assert.equal(response.status, 200);
  return response.json() as Promise<{ events: number; source: string }>;
}

async function recordEvent(
  baseUrl: string,
  message: string,
): Promise<{ id: number; message: string }> {
  const response = await fetch(`${baseUrl}/system/events`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  assert.equal(response.status, 201);
  return response.json() as Promise<{ id: number; message: string }>;
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
