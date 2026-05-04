import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

export interface DrizzleErrorMappingOptions {
  uniqueMessage?: string;
  foreignKeyMessage?: string;
  notNullMessage?: string;
  fallbackMessage?: string;
}

export function mapDrizzleError(
  error: unknown,
  options: DrizzleErrorMappingOptions = {},
): Error {
  if (isUniqueConstraintError(error)) {
    return new ConflictException(
      options.uniqueMessage ?? 'Resource already exists.',
    );
  }

  if (isForeignKeyConstraintError(error)) {
    return new BadRequestException(
      options.foreignKeyMessage ?? 'Related resource does not exist.',
    );
  }

  if (isNotNullConstraintError(error)) {
    return new BadRequestException(
      options.notNullMessage ?? 'Required value is missing.',
    );
  }

  return error instanceof Error
    ? error
    : new InternalServerErrorException(
      options.fallbackMessage ?? 'Database operation failed.',
    );
}

export function isUniqueConstraintError(error: unknown): boolean {
  return errorHasAnyCode(error, ['23505', 'ER_DUP_ENTRY', 'SQLITE_CONSTRAINT_UNIQUE']);
}

export function isForeignKeyConstraintError(error: unknown): boolean {
  return errorHasAnyCode(error, ['23503', 'ER_NO_REFERENCED_ROW_2', 'SQLITE_CONSTRAINT_FOREIGNKEY']);
}

export function isNotNullConstraintError(error: unknown): boolean {
  return errorHasAnyCode(error, ['23502', 'ER_BAD_NULL_ERROR', 'SQLITE_CONSTRAINT_NOTNULL']);
}

function errorHasAnyCode(error: unknown, expectedCodes: string[]): boolean {
  const codes = collectErrorCodes(error);
  return codes.some(code => expectedCodes.includes(code));
}

function collectErrorCodes(error: unknown): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const maybeError = error as Record<string, unknown>;
  return [
    maybeError.code,
    maybeError.errno,
    maybeError.cause && typeof maybeError.cause === 'object'
      ? (maybeError.cause as Record<string, unknown>).code
      : undefined,
  ]
    .filter((code): code is string | number => typeof code === 'string' || typeof code === 'number')
    .map(code => String(code));
}
