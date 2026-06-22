import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

interface ProductResponse {
  id: number;
  name: string;
  price: number;
  active: boolean;
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
    const before = await getProducts(baseUrl);
    const created = await createProduct(baseUrl, {
      name: 'Repository sample',
      price: 42,
    });
    const renamed = await renameProduct(baseUrl, created.id, 'Repository sample updated');
    const deactivated = await deactivateProduct(baseUrl, created.id);
    const after = await getProducts(baseUrl);

    assert.equal(created.name, 'Repository sample');
    assert.equal(renamed.name, 'Repository sample updated');
    assert.equal(deactivated.active, false);
    assert.equal(after.length, before.length + 1);
    assert.equal(after[0]?.id, created.id);
  } finally {
    await app.close();
  }
}

async function getProducts(baseUrl: string): Promise<ProductResponse[]> {
  const response = await fetch(`${baseUrl}/products`);
  assert.equal(response.status, 200);
  return response.json() as Promise<ProductResponse[]>;
}

async function createProduct(
  baseUrl: string,
  body: { name: string; price: number },
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

async function renameProduct(
  baseUrl: string,
  id: number,
  name: string,
): Promise<ProductResponse> {
  const response = await fetch(`${baseUrl}/products/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  assert.equal(response.status, 200);
  return response.json() as Promise<ProductResponse>;
}

async function deactivateProduct(
  baseUrl: string,
  id: number,
): Promise<ProductResponse> {
  const response = await fetch(`${baseUrl}/products/${id}/deactivate`, {
    method: 'POST',
  });

  assert.equal(response.status, 201);
  return response.json() as Promise<ProductResponse>;
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
