import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  isForeignKeyConstraintError,
  isNotNullConstraintError,
  isUniqueConstraintError,
  mapDrizzleError,
} from '../errors/drizzle-error.mapper';

describe('Drizzle error mapping helpers', () => {
  it('detects unique constraint errors across common drivers', () => {
    assert.equal(isUniqueConstraintError({ code: '23505' }), true);
    assert.equal(isUniqueConstraintError({ errno: 'ER_DUP_ENTRY' }), true);
    assert.equal(isUniqueConstraintError({ code: 'OTHER' }), false);
  });

  it('detects foreign key constraint errors from nested causes', () => {
    assert.equal(
      isForeignKeyConstraintError({
        cause: {
          code: 'SQLITE_CONSTRAINT_FOREIGNKEY',
        },
      }),
      true,
    );
  });

  it('detects not-null constraint errors', () => {
    assert.equal(isNotNullConstraintError({ code: '23502' }), true);
  });

  it('maps known database failures to Nest exceptions', () => {
    assert.ok(mapDrizzleError({ code: '23505' }) instanceof ConflictException);
    assert.ok(mapDrizzleError({ code: '23503' }) instanceof BadRequestException);
    assert.ok(mapDrizzleError({ code: '23502' }) instanceof BadRequestException);
  });

  it('preserves existing Error instances and wraps unknown values', () => {
    const error = new Error('driver failed');

    assert.equal(mapDrizzleError(error), error);
    assert.ok(mapDrizzleError('driver failed') instanceof
      InternalServerErrorException,
    );
  });
});
