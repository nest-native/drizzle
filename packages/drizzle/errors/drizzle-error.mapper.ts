import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

export interface DrizzleErrorMappingOptions {
  uniqueMessage?: string;
  foreignKeyMessage?: string;
  notNullMessage?: string;
  checkMessage?: string;
  fallbackMessage?: string;
}

/** The constraint families this package recognises across all supported drivers. */
export const DRIZZLE_VIOLATION_KINDS = [
  'unique',
  'foreignKey',
  'notNull',
  'check',
] as const;
export type DrizzleViolationKind = (typeof DRIZZLE_VIOLATION_KINDS)[number];

/**
 * What a failed write actually said, normalised across drivers.
 *
 * Drizzle wraps driver errors (`DrizzleQueryError`) and the useful parts —
 * SQLSTATE, the constraint name, the offending column — end up nested on
 * `cause` in a driver-specific shape. This is that information, flattened, so a
 * caller can build a field-level response without re-parsing the driver error.
 *
 * Everything except `kind` is **best-effort**: drivers disagree about what they
 * report, so `table`/`constraint`/`column` are populated when the driver
 * volunteers them and left `undefined` otherwise. Never branch on their
 * presence for correctness — branch on `kind`.
 */
export interface DrizzleViolation {
  kind: DrizzleViolationKind;
  /** The raw driver code that identified it (`'23505'`, `'ER_DUP_ENTRY'`, …). */
  code: string;
  table?: string;
  constraint?: string;
  /**
   * The offending column, when the driver names it. `pg` does not, so this is
   * typically only present on MySQL/SQLite; deriving it from the constraint
   * name is deliberately NOT attempted (see the note in `readColumn`).
   */
  column?: string;
  /** The driver's own detail line, when it has one. */
  detail?: string;
}

const CODES: Record<DrizzleViolationKind, readonly string[]> = {
  unique: ['23505', 'ER_DUP_ENTRY', '1062', 'SQLITE_CONSTRAINT_UNIQUE', 'SQLITE_CONSTRAINT_PRIMARYKEY'],
  foreignKey: ['23503', 'ER_NO_REFERENCED_ROW_2', '1452', 'SQLITE_CONSTRAINT_FOREIGNKEY'],
  notNull: ['23502', 'ER_BAD_NULL_ERROR', '1048', 'SQLITE_CONSTRAINT_NOTNULL'],
  check: ['23514', 'ER_CHECK_CONSTRAINT_VIOLATED', '3819', 'SQLITE_CONSTRAINT_CHECK'],
};

/**
 * Maps a Drizzle/driver error to the Nest exception that fits it, or returns
 * the error unchanged when it is not a constraint violation.
 *
 * This is opt-in by design — the package never installs global error mapping
 * for you. Call it in a `catch`, or register {@link DrizzleExceptionFilter} if
 * you would rather stop writing `catch` blocks.
 */
export function mapDrizzleError(
  error: unknown,
  options: DrizzleErrorMappingOptions = {},
): Error {
  const violation = describeDrizzleError(error);

  if (violation?.kind === 'unique') {
    return new ConflictException(
      options.uniqueMessage ?? 'Resource already exists.',
    );
  }

  if (violation?.kind === 'foreignKey') {
    return new BadRequestException(
      options.foreignKeyMessage ?? 'Related resource does not exist.',
    );
  }

  if (violation?.kind === 'notNull') {
    return new BadRequestException(
      options.notNullMessage ?? 'Required value is missing.',
    );
  }

  if (violation?.kind === 'check') {
    return new BadRequestException(
      options.checkMessage ?? 'Value violates a database constraint.',
    );
  }

  return error instanceof Error
    ? error
    : new InternalServerErrorException(
      options.fallbackMessage ?? 'Database operation failed.',
    );
}

/**
 * The structured view of a constraint violation, or `undefined` when the error
 * is not one. Use it when the Nest exception alone is not enough — building a
 * `{ field: message }` response, deciding which retry to attempt, or logging
 * the constraint that actually fired.
 */
export function describeDrizzleError(
  error: unknown,
): DrizzleViolation | undefined {
  const chain = collectErrorChain(error);
  for (const kind of DRIZZLE_VIOLATION_KINDS) {
    const match = chain.find((link) =>
      link.codes.some((code) => CODES[kind].includes(code)),
    );
    if (match) {
      return {
        kind,
        code: match.codes[0],
        ...pickDefined('table', readString(match.source, ['table', 'table_name'])),
        ...pickDefined('constraint', readString(match.source, ['constraint', 'constraint_name'])),
        ...pickDefined('column', readColumn(match.source)),
        ...pickDefined('detail', readString(match.source, ['detail', 'sqlMessage'])),
      };
    }
  }
  return undefined;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return describeDrizzleError(error)?.kind === 'unique';
}

export function isForeignKeyConstraintError(error: unknown): boolean {
  return describeDrizzleError(error)?.kind === 'foreignKey';
}

export function isNotNullConstraintError(error: unknown): boolean {
  return describeDrizzleError(error)?.kind === 'notNull';
}

export function isCheckConstraintError(error: unknown): boolean {
  return describeDrizzleError(error)?.kind === 'check';
}

interface ErrorLink {
  source: Record<string, unknown>;
  codes: string[];
}

/**
 * Every error in the `cause` chain that carries an identifying code, nearest
 * first. Walking the chain matters because Drizzle wraps driver errors: the
 * SQLSTATE lives on `error.cause`, and adapters sometimes wrap once more.
 */
function collectErrorChain(error: unknown): ErrorLink[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const source = error as Record<string, unknown>;
  const codes = [source.code, source.errno, source.extendedCode]
    .filter(
      (code): code is string | number =>
        typeof code === 'string' || typeof code === 'number',
    )
    .map(String);

  const here = codes.length > 0 ? [{ source, codes }] : [];
  return [...here, ...collectErrorChain(source.cause)];
}

/**
 * The offending column, only when the driver actually names it.
 *
 * Deliberately does NOT infer the column from the constraint name: that only
 * works for drizzle-kit's generated naming and is silently wrong on
 * hand-written migrations, renamed constraints, legacy schemas, and composite
 * or expression indexes. A wrong field name in a validation response is worse
 * than no field name.
 */
function readColumn(source: Record<string, unknown>): string | undefined {
  return readString(source, ['column', 'column_name']);
}

function readString(
  source: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

/** Keeps optional keys absent rather than explicitly `undefined`. */
function pickDefined(
  key: string,
  value: string | undefined,
): Record<string, string> {
  return value === undefined ? {} : { [key]: value };
}
