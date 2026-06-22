import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

interface LivenessResponse {
  status: 'ok';
}

interface ReadinessResponse {
  status: 'ready';
  database: 'ok';
}

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
    assert.deepEqual(await getJson<LivenessResponse>(`${baseUrl}/health/live`), {
      status: 'ok',
    });
    assert.deepEqual(
      await getJson<ReadinessResponse>(`${baseUrl}/health/ready`),
      {
        status: 'ready',
        database: 'ok',
      },
    );
  } finally {
    await app.close();
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  return response.json() as Promise<T>;
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
