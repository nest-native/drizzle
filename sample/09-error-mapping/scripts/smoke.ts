import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

interface MemberResponse {
  id: number;
  email: string;
  displayName: string;
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
    assert.deepEqual(await listMembers(baseUrl), []);

    const created = await createMember(baseUrl, {
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
    });
    assert.equal(created.status, 201);

    const duplicate = await createMember(baseUrl, {
      email: 'ada@example.com',
      displayName: 'Ada Duplicate',
    });
    const duplicateBody = await duplicate.json() as {
      message: string;
    };

    assert.equal(duplicate.status, 409);
    assert.equal(
      duplicateBody.message,
      'A member with this email already exists.',
    );

    const missingEmail = await fetch(`${baseUrl}/members/missing-email`, {
      method: 'POST',
    });
    const missingEmailBody = await missingEmail.json() as {
      message: string;
    };

    assert.equal(missingEmail.status, 400);
    assert.equal(missingEmailBody.message, 'Member email is required.');

    const members = await listMembers(baseUrl);
    assert.equal(members.length, 1);
    assert.equal(members[0]?.email, 'ada@example.com');
  } finally {
    await app.close();
  }
}

async function listMembers(baseUrl: string): Promise<MemberResponse[]> {
  const response = await fetch(`${baseUrl}/members`);
  assert.equal(response.status, 200);
  return response.json() as Promise<MemberResponse[]>;
}

async function createMember(
  baseUrl: string,
  body: { email: string; displayName: string },
): Promise<Response> {
  return fetch(`${baseUrl}/members`, {
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
