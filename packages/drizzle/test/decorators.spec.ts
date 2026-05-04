import assert from 'node:assert/strict';
import Module from 'node:module';
import { describe, it } from 'node:test';
import {
  DrizzleRepository,
  getDrizzleRepositoryMetadata,
} from '../decorators/drizzle-repository.decorator';
import { InjectTransaction } from '../decorators/inject-transaction.decorator';
import { Transactional } from '../decorators/transactional.decorator';
import {
  getDrizzleClientToken,
  getDrizzleOptionsToken,
  getDrizzleSchemaToken,
  getDrizzleTransactionToken,
  normalizeDrizzleConnectionName,
} from '../tokens';

describe('decorators and tokens', () => {
  it('stores repository metadata with the default connection name', () => {
    @DrizzleRepository()
    class UsersRepository {}

    assert.deepEqual(getDrizzleRepositoryMetadata(UsersRepository), {
      connectionName: 'default',
    });
  });

  it('stores repository metadata with a named connection', () => {
    @DrizzleRepository('analytics')
    class AnalyticsRepository {}

    assert.deepEqual(getDrizzleRepositoryMetadata(AnalyticsRepository), {
      connectionName: 'analytics',
    });
  });

  it('stores repository metadata from options objects', () => {
    @DrizzleRepository({ connectionName: 'primary' })
    class PrimaryRepository {}

    assert.deepEqual(getDrizzleRepositoryMetadata(PrimaryRepository), {
      connectionName: 'primary',
    });
  });

  it('normalizes empty connection names to default tokens', () => {
    assert.equal(normalizeDrizzleConnectionName('  '), 'default');
    assert.equal(getDrizzleClientToken(), 'DRIZZLE_CLIENT');
    assert.equal(getDrizzleOptionsToken(), 'DRIZZLE_MODULE_OPTIONS');
    assert.equal(getDrizzleSchemaToken(), 'DRIZZLE_SCHEMA');
    assert.equal(getDrizzleTransactionToken(), 'DRIZZLE_TRANSACTION');
  });

  it('builds stable tokens for named connections', () => {
    assert.equal(
      getDrizzleClientToken('analytics'),
      'DRIZZLE_CLIENT:analytics',
    );
    assert.equal(
      getDrizzleOptionsToken('analytics'),
      'DRIZZLE_MODULE_OPTIONS:analytics',
    );
    assert.equal(
      getDrizzleSchemaToken('analytics'),
      'DRIZZLE_SCHEMA:analytics',
    );
    assert.equal(
      getDrizzleTransactionToken('analytics'),
      'DRIZZLE_TRANSACTION:analytics',
    );
  });

  it('fails loudly when @Transactional is used without its CLS peer', () => {
    assert.throws(
      () => Transactional(),
      '@nestjs-cls/transactional',
    );
  });

  it('delegates @Transactional to the CLS package when present', () => {
    const originalLoad = (Module as any)._load;
    let receivedArgs: unknown[] = [];

    (Module as any)._load = (request: string, ...args: unknown[]) => {
      if (request === '@nestjs-cls/transactional') {
        return {
          Transactional: (...decoratorArgs: unknown[]) => {
            receivedArgs = decoratorArgs;
            return () => undefined;
          },
        };
      }

      return originalLoad(request, ...args);
    };

    try {
      Transactional({ connectionName: 'default' })(class Example {});

      assert.deepEqual(receivedArgs, [
        {
          connectionName: 'default',
        },
      ]);
    } finally {
      (Module as any)._load = originalLoad;
    }
  });

  it('rethrows unexpected CLS package loading failures', () => {
    const originalLoad = (Module as any)._load;

    (Module as any)._load = (request: string, ...args: unknown[]) => {
      if (request === '@nestjs-cls/transactional') {
        const error = new Error('boom');
        (error as { code?: string }).code = 'E_CUSTOM';
        throw error;
      }

      return originalLoad(request, ...args);
    };

    try {
      assert.throws(() => Transactional(), /boom/);
    } finally {
      (Module as any)._load = originalLoad;
    }
  });

  it('falls back to the local transaction token when CLS injection is absent', () => {
    class TransactionConsumer {
      constructor(@InjectTransaction('analytics') readonly tx: unknown) {}
    }

    assert.equal(typeof TransactionConsumer, 'function');
  });

  it('delegates @InjectTransaction to the CLS package when present', () => {
    const originalLoad = (Module as any)._load;
    let receivedArgs: unknown[] = [];

    (Module as any)._load = (request: string, ...args: unknown[]) => {
      if (request === '@nestjs-cls/transactional') {
        return {
          InjectTransaction: (...decoratorArgs: unknown[]) => {
            receivedArgs = decoratorArgs;
            return () => undefined;
          },
        };
      }

      return originalLoad(request, ...args);
    };

    try {
      class TransactionConsumer {
        constructor(@InjectTransaction('analytics') readonly tx: unknown) {}
      }

      assert.equal(typeof TransactionConsumer, 'function');
      assert.deepEqual(receivedArgs, ['analytics']);
    } finally {
      (Module as any)._load = originalLoad;
    }
  });

  it('falls back when the CLS package has no InjectTransaction export', () => {
    const originalLoad = (Module as any)._load;

    (Module as any)._load = (request: string, ...args: unknown[]) => {
      if (request === '@nestjs-cls/transactional') {
        return {};
      }

      return originalLoad(request, ...args);
    };

    try {
      class TransactionConsumer {
        constructor(@InjectTransaction('analytics') readonly tx: unknown) {}
      }

      assert.equal(typeof TransactionConsumer, 'function');
    } finally {
      (Module as any)._load = originalLoad;
    }
  });

  it('rethrows unexpected CLS injection package loading failures', () => {
    const originalLoad = (Module as any)._load;

    (Module as any)._load = (request: string, ...args: unknown[]) => {
      if (request === '@nestjs-cls/transactional') {
        const error = new Error('inject boom');
        (error as { code?: string }).code = 'E_CUSTOM';
        throw error;
      }

      return originalLoad(request, ...args);
    };

    try {
      assert.throws(() => InjectTransaction(), /inject boom/);
    } finally {
      (Module as any)._load = originalLoad;
    }
  });
});
