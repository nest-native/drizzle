import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

interface LivenessResponse {
  status: 'ok';
}

interface ReadinessResponse {
  status: 'ready';
  database: 'ok';
}

async function smoke(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
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
