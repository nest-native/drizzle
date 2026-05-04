import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import { DrizzleTestModule } from '../testing/drizzle-test.module';
import {
  createDrizzleMockClient,
  createDrizzleRepositoryMock,
} from '../testing/mock-client';
import { getDrizzleClientToken } from '../tokens';

describe('Drizzle testing helpers', () => {
  it('creates override-friendly mock clients', () => {
    const client = createDrizzleMockClient({
      query: {
        users: {
          findMany: () => ['Ada'],
        },
      },
    });

    assert.deepEqual(client.query.users.findMany(), ['Ada']);
  });

  it('creates empty mock clients by default', () => {
    assert.deepEqual(createDrizzleMockClient(), {});
  });

  it('creates repository mocks', () => {
    const repository = createDrizzleRepositoryMock({
      findMany: () => ['Grace'],
    });

    assert.deepEqual(repository.findMany(), ['Grace']);
  });

  it('registers a test module with a client', async () => {
    const client = createDrizzleMockClient({ tx: 'test-client' });
    const module = await Test.createTestingModule({
      imports: [
        DrizzleTestModule.forRoot({
          client,
        }),
      ],
    }).compile();

    assert.equal(module.get(getDrizzleClientToken()), client);
  });

  it('delegates repository registration for tests', () => {
    const featureModule = DrizzleTestModule.forFeature();

    assert.deepEqual(featureModule.providers, []);
    assert.deepEqual(featureModule.exports, []);
  });
});
