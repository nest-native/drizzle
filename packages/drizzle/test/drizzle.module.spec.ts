import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DrizzleModule } from '../drizzle.module';
import { DrizzleRepository } from '../decorators/drizzle-repository.decorator';
import { InjectDrizzle } from '../decorators/inject-drizzle.decorator';
import {
  getDrizzleClientToken,
  getDrizzleSchemaToken,
} from '../tokens';

interface FakeClient {
  query: {
    users: {
      findMany: () => string[];
    };
  };
}

const fakeClient: FakeClient = {
  query: {
    users: {
      findMany: () => ['Ada', 'Grace'],
    },
  },
};

@DrizzleRepository()
class UsersRepository {
  constructor(@InjectDrizzle() private readonly client: FakeClient) {}

  findMany(): string[] {
    return this.client.query.users.findMany();
  }
}

@Injectable()
class NamedClientConsumer {
  constructor(@InjectDrizzle('analytics') readonly client: FakeClient) {}
}

describe('DrizzleModule', () => {
  it('provides the default Drizzle client and schema', async () => {
    const schema = { users: { table: 'users' } };
    const module = await Test.createTestingModule({
      imports: [
        DrizzleModule.forRoot({
          connection: fakeClient,
          schema,
        }),
      ],
    }).compile();

    assert.equal(module.get(getDrizzleClientToken()), fakeClient);
    assert.equal(module.get(getDrizzleSchemaToken()), schema);
  });

  it('uses global root modules by default and allows explicit opt-out', () => {
    assert.equal(
      DrizzleModule.forRoot({
        connection: fakeClient,
      }).global,
      true,
    );
    assert.equal(
      DrizzleModule.forRoot({
        connection: fakeClient,
        isGlobal: false,
      }).global,
      false,
    );
  });

  it('resolves connection factories and calls shutdown hooks', async () => {
    let shutdownClient: FakeClient | undefined;
    const module = await Test.createTestingModule({
      imports: [
        DrizzleModule.forRoot({
          connection: () => fakeClient,
          shutdown: client => {
            shutdownClient = client;
          },
        }),
      ],
    }).compile();

    assert.equal(module.get(getDrizzleClientToken()), fakeClient);

    await module.close();

    assert.equal(shutdownClient, fakeClient);
  });

  it('supports async module options', async () => {
    const module = await Test.createTestingModule({
      imports: [
        DrizzleModule.forRootAsync({
          useFactory: async () => ({
            connection: fakeClient,
          }),
        }),
      ],
    }).compile();

    assert.equal(module.get(getDrizzleClientToken()), fakeClient);
  });

  it('supports named client injection', async () => {
    const module = await Test.createTestingModule({
      imports: [
        DrizzleModule.forRoot({
          connectionName: 'analytics',
          connection: fakeClient,
        }),
      ],
      providers: [NamedClientConsumer],
    }).compile();

    assert.equal(module.get(NamedClientConsumer).client, fakeClient);
  });

  it('registers repository classes through forFeature', async () => {
    const module = await Test.createTestingModule({
      imports: [
        DrizzleModule.forRoot({
          connection: fakeClient,
        }),
        DrizzleModule.forFeature([UsersRepository]),
      ],
    }).compile();

    assert.deepEqual(module.get(UsersRepository).findMany(), [
      'Ada',
      'Grace',
    ]);
  });

  it('allows an empty forFeature registration', () => {
    const featureModule = DrizzleModule.forFeature();

    assert.deepEqual(featureModule.providers, []);
    assert.deepEqual(featureModule.exports, []);
  });
});
