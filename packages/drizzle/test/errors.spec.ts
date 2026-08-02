import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  describeDrizzleError,
  isCheckConstraintError,
  isForeignKeyConstraintError,
  isNotNullConstraintError,
  isUniqueConstraintError,
  mapDrizzleError,
} from '../errors/drizzle-error.mapper';

describe('Drizzle error mapping helpers', () => {
  it('detects unique constraint errors across common drivers', () => {
    assert.equal(isUniqueConstraintError({ code: '23505' }), true);
    assert.equal(isUniqueConstraintError({ errno: 'ER_DUP_ENTRY' }), true);
    assert.equal(
      isUniqueConstraintError({
        cause: {
          code: 'SQLITE_CONSTRAINT',
          extendedCode: 'SQLITE_CONSTRAINT_UNIQUE',
        },
      }),
      true,
    );
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

describe('describeDrizzleError (structured violations)', () => {
  it('flattens what the driver actually reported, nested under cause', () => {
    // The shape node-postgres produces, wrapped the way DrizzleQueryError wraps it.
    const violation = describeDrizzleError({
      message: 'Failed query',
      cause: {
        code: '23505',
        table: 'members',
        constraint: 'members_email_unique',
        detail: 'Key (email)=(a@b.c) already exists.',
      },
    });

    assert.deepEqual(violation, {
      kind: 'unique',
      code: '23505',
      table: 'members',
      constraint: 'members_email_unique',
      detail: 'Key (email)=(a@b.c) already exists.',
    });
    // Absent, not explicitly undefined — pg does not name the column.
    assert.equal('column' in (violation as object), false);
  });

  it('reads the snake_case field names MySQL/SQLite drivers use', () => {
    const violation = describeDrizzleError({
      code: 'ER_BAD_NULL_ERROR',
      table_name: 'members',
      column_name: 'email',
      sqlMessage: "Column 'email' cannot be null",
    });

    assert.equal(violation?.kind, 'notNull');
    assert.equal(violation?.table, 'members');
    assert.equal(violation?.column, 'email');
    assert.equal(violation?.detail, "Column 'email' cannot be null");
  });

  it('recognises check constraints, which the 0.4.x mapper did not', () => {
    assert.equal(describeDrizzleError({ code: '23514' })?.kind, 'check');
    assert.equal(isCheckConstraintError({ errno: 3819 }), true);
    assert.equal(
      isCheckConstraintError({ cause: { extendedCode: 'SQLITE_CONSTRAINT_CHECK' } }),
      true,
    );
    assert.equal(isCheckConstraintError({ code: '23505' }), false);
  });

  it('treats a numeric MySQL errno as the code it is', () => {
    // mysql2 reports errno numerically; the string table must still match.
    assert.equal(describeDrizzleError({ errno: 1062 })?.kind, 'unique');
    assert.equal(describeDrizzleError({ errno: 1452 })?.kind, 'foreignKey');
  });

  it('returns undefined for anything that is not a constraint violation', () => {
    assert.equal(describeDrizzleError(undefined), undefined);
    assert.equal(describeDrizzleError(null), undefined);
    assert.equal(describeDrizzleError('boom'), undefined);
    assert.equal(describeDrizzleError(new Error('timeout')), undefined);
    assert.equal(describeDrizzleError({ code: 'ECONNREFUSED' }), undefined);
  });

  it('ignores empty-string metadata rather than reporting it as present', () => {
    const violation = describeDrizzleError({ code: '23505', table: '', constraint: 'x' });
    assert.equal('table' in (violation as object), false);
    assert.equal(violation?.constraint, 'x');
  });

  it('does NOT guess the column from the constraint name', () => {
    // members_email_unique looks like it names a column, but inferring that is
    // only valid for drizzle-kit's generated naming — a wrong field name in a
    // validation response is worse than no field name.
    const violation = describeDrizzleError({
      code: '23505',
      constraint: 'members_email_unique',
    });
    assert.equal('column' in (violation as object), false);
  });

  it('maps a check violation to 400 with an overridable message', () => {
    const mapped = mapDrizzleError({ code: '23514' });
    assert.ok(mapped instanceof BadRequestException);
    const custom = mapDrizzleError({ code: '23514' }, { checkMessage: 'Age must be positive.' });
    assert.equal(custom.message, 'Age must be positive.');
  });
});
