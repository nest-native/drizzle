import { Module } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { TenantContext } from './tenant.context';

@Module({
  providers: [ApiKeyGuard, TenantContext],
  exports: [ApiKeyGuard, TenantContext],
})
export class AuthModule {}
