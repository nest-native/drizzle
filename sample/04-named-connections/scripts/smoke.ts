import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

interface ProductResponse {
  id: number;
  sku: string;
  name: string;
}

interface AnalyticsEventResponse {
  id: number;
  eventName: string;
  subject: string;
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
    const productsBefore = await listProducts(baseUrl);
    const eventsBefore = await listEvents(baseUrl);
    const product = await createProduct(baseUrl, {
      sku: 'multi-db-001',
      name: 'Named connection sample',
    });
    const productsAfter = await listProducts(baseUrl);
    const eventsAfter = await listEvents(baseUrl);

    assert.equal(product.sku, 'multi-db-001');
    assert.equal(productsAfter.length, productsBefore.length + 1);
    assert.equal(eventsAfter.length, eventsBefore.length + 1);
    assert.equal(eventsAfter[0]?.eventName, 'product.created');
    assert.equal(eventsAfter[0]?.subject, 'multi-db-001');
  } finally {
    await app.close();
  }
}

async function listProducts(baseUrl: string): Promise<ProductResponse[]> {
  const response = await fetch(`${baseUrl}/products`);
  assert.equal(response.status, 200);
  return response.json() as Promise<ProductResponse[]>;
}

async function createProduct(
  baseUrl: string,
  body: { sku: string; name: string },
): Promise<ProductResponse> {
  const response = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  assert.equal(response.status, 201);
  return response.json() as Promise<ProductResponse>;
}

async function listEvents(
  baseUrl: string,
): Promise<AnalyticsEventResponse[]> {
  const response = await fetch(`${baseUrl}/analytics/events`);
  assert.equal(response.status, 200);
  return response.json() as Promise<AnalyticsEventResponse[]>;
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
