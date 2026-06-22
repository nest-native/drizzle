import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

interface CustomerResponse {
  id: number;
  email: string;
  displayName: string;
  plan: 'free' | 'team' | 'enterprise';
  seats: number;
  createdAt: string;
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
    assert.deepEqual(await listCustomers(baseUrl), []);

    const invalid = await createCustomer(baseUrl, {
      email: 'bad-email',
      displayName: 'AI',
      plan: 'personal',
      seats: 0,
      unexpected: true,
    });
    const invalidBody = await invalid.json() as {
      message: string[];
    };

    assert.equal(invalid.status, 400);
    assert.ok(
      invalidBody.message.some(message => message.includes('email')),
    );
    assert.ok(
      invalidBody.message.some(message => message.includes('unexpected')),
    );
    assert.deepEqual(await listCustomers(baseUrl), []);

    const valid = await createCustomer(baseUrl, {
      email: 'grace@example.com',
      displayName: 'Grace Hopper',
      plan: 'team',
      seats: '7',
    });
    const customer = await valid.json() as CustomerResponse;

    assert.equal(valid.status, 201);
    assert.equal(customer.email, 'grace@example.com');
    assert.equal(customer.displayName, 'Grace Hopper');
    assert.equal(customer.plan, 'team');
    assert.equal(customer.seats, 7);

    const customers = await listCustomers(baseUrl);
    assert.equal(customers.length, 1);
    assert.equal(customers[0]?.id, customer.id);
  } finally {
    await app.close();
  }
}

async function listCustomers(baseUrl: string): Promise<CustomerResponse[]> {
  const response = await fetch(`${baseUrl}/customers`);
  assert.equal(response.status, 200);
  return response.json() as Promise<CustomerResponse[]>;
}

async function createCustomer(
  baseUrl: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
