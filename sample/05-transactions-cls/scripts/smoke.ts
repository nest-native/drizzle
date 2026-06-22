import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

interface AccountResponse {
  id: number;
  balance: number;
}

interface LedgerEntryResponse {
  id: number;
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
    const initialAccounts = await getAccounts(baseUrl);
    const initialLedger = await getLedger(baseUrl);

    const rollbackResponse = await postTransfer(baseUrl, 'rollback', 7);
    assert.equal(rollbackResponse.status, 500);
    assert.deepEqual(await getAccounts(baseUrl), initialAccounts);
    assert.deepEqual(await getLedger(baseUrl), initialLedger);

    const commitResponse = await postTransfer(baseUrl, 'commit', 10);
    assert.equal(commitResponse.status, 201);
    assert.equal((await commitResponse.json()).transactionActive, true);

    const committedAccounts = await getAccounts(baseUrl);
    const committedLedger = await getLedger(baseUrl);
    assert.equal(balance(committedAccounts, 1), balance(initialAccounts, 1) - 10);
    assert.equal(balance(committedAccounts, 2), balance(initialAccounts, 2) + 10);
    assert.equal(committedLedger.length, initialLedger.length + 1);
  } finally {
    await app.close();
  }
}

async function getAccounts(baseUrl: string): Promise<AccountResponse[]> {
  const response = await fetch(`${baseUrl}/accounts`);
  assert.equal(response.status, 200);
  return response.json() as Promise<AccountResponse[]>;
}

async function getLedger(baseUrl: string): Promise<LedgerEntryResponse[]> {
  const response = await fetch(`${baseUrl}/ledger`);
  assert.equal(response.status, 200);
  return response.json() as Promise<LedgerEntryResponse[]>;
}

async function postTransfer(
  baseUrl: string,
  kind: 'commit' | 'rollback',
  amount: number,
): Promise<Response> {
  return fetch(`${baseUrl}/transfers/${kind}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      fromAccountId: 1,
      toAccountId: 2,
      amount,
    }),
  });
}

function balance(accounts: AccountResponse[], id: number): number {
  const account = accounts.find(item => item.id === id);
  assert.ok(account);
  return account.balance;
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
