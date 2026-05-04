import { Inject } from '@nestjs/common';
import { getDrizzleTransactionToken } from '../tokens';

type InjectTransactionFactory = (...args: unknown[]) => ReturnType<typeof Inject>;

export function InjectTransaction(
  connectionName?: string,
): ReturnType<typeof Inject> {
  const clsDecorator = loadClsInjectTransaction();

  if (clsDecorator) {
    return clsDecorator(connectionName);
  }

  return Inject(getDrizzleTransactionToken(connectionName));
}

function loadClsInjectTransaction(): InjectTransactionFactory | undefined {
  try {
    const transactionalPackage = require('@nestjs-cls/transactional') as Record<
      string,
      unknown
    >;
    const decorator = transactionalPackage.InjectTransaction;
    return typeof decorator === 'function'
      ? decorator as InjectTransactionFactory
      : undefined;
  } catch (error) {
    if (isModuleNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

function isModuleNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'MODULE_NOT_FOUND'
  );
}
