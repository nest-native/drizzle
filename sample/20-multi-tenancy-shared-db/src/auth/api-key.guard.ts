import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { users } from '../schema';
import type { TenantRequest } from './tenant-request';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const apiKey = readApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException();
    }

    const [user] = await this.db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.apiKey, apiKey))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;
    return true;
  }
}

function readApiKey(request: TenantRequest): string | undefined {
  const header = request.headers['x-api-key'];
  return Array.isArray(header) ? header[0] : header;
}
