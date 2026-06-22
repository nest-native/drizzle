import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

interface TicketResponse {
  id: number;
  title: string;
  requesterEmail: string;
  priority: 'low' | 'normal' | 'urgent';
  estimatePoints: number;
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
    assert.deepEqual(await listTickets(baseUrl), []);

    const invalid = await createTicket(baseUrl, {
      title: 'No',
      requesterEmail: 'not-an-email',
      priority: 'normal',
      estimatePoints: 0,
    });

    assert.equal(invalid.status, 400);
    assert.deepEqual(await listTickets(baseUrl), []);

    const valid = await createTicket(baseUrl, {
      title: 'Document schema-derived validation',
      requesterEmail: 'ada@example.com',
      priority: 'urgent',
      estimatePoints: 5,
    });
    const ticket = await valid.json() as TicketResponse;

    assert.equal(valid.status, 201);
    assert.equal(ticket.title, 'Document schema-derived validation');
    assert.equal(ticket.requesterEmail, 'ada@example.com');
    assert.equal(ticket.priority, 'urgent');
    assert.equal(ticket.estimatePoints, 5);

    const tickets = await listTickets(baseUrl);
    assert.equal(tickets.length, 1);
    assert.equal(tickets[0]?.id, ticket.id);
  } finally {
    await app.close();
  }
}

async function listTickets(baseUrl: string): Promise<TicketResponse[]> {
  const response = await fetch(`${baseUrl}/tickets`);
  assert.equal(response.status, 200);
  return response.json() as Promise<TicketResponse[]>;
}

async function createTicket(
  baseUrl: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${baseUrl}/tickets`, {
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
