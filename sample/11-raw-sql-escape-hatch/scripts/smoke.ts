import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

interface RevenueReportRow {
  segment: string;
  customerCount: number;
  orderCount: number;
  totalRevenue: number;
}

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

  try {
    const baseUrl = await app.getUrl();

    assert.deepEqual(await fetchRevenue(baseUrl, 'minTotal=100'), [
      {
        segment: 'enterprise',
        customerCount: 2,
        orderCount: 3,
        totalRevenue: 470,
      },
      {
        segment: 'smb',
        customerCount: 1,
        orderCount: 2,
        totalRevenue: 120,
      },
    ]);

    assert.deepEqual(
      await fetchRevenue(baseUrl, 'segment=indie&minTotal=0'),
      [
        {
          segment: 'indie',
          customerCount: 1,
          orderCount: 1,
          totalRevenue: 20,
        },
      ],
    );
  } finally {
    await app.close();
  }
}

async function fetchRevenue(
  baseUrl: string,
  query: string,
): Promise<RevenueReportRow[]> {
  const response = await fetch(`${baseUrl}/reports/revenue?${query}`);
  assert.equal(response.status, 200);
  return response.json() as Promise<RevenueReportRow[]>;
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
