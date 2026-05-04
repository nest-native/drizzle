import { Inject } from '@nestjs/common';
import { getDrizzleClientToken } from '../tokens';

export function InjectDrizzle(connectionName?: string): ReturnType<typeof Inject> {
  return Inject(getDrizzleClientToken(connectionName));
}
