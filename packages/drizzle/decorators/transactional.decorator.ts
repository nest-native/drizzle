type NestDecorator = ClassDecorator & MethodDecorator;
type TransactionalFactory = (...args: unknown[]) => NestDecorator;

export function Transactional(...args: unknown[]): NestDecorator {
  return loadTransactionalDecorator()(...args);
}

function loadTransactionalDecorator(): TransactionalFactory {
  const module = loadOptionalTransactionalPackage();
  const transactional = module?.Transactional;

  if (typeof transactional !== 'function') {
    throw new Error(
      'Transactional support requires @nestjs-cls/transactional. Install and configure that package before using @Transactional().',
    );
  }

  return transactional as TransactionalFactory;
}

function loadOptionalTransactionalPackage(): Record<string, unknown> | undefined {
  try {
    return require('@nestjs-cls/transactional') as Record<string, unknown>;
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
