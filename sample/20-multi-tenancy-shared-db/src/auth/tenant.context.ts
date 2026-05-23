import { Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { AuthenticatedUser } from './authenticated-user';
import type { TenantRequest } from './tenant-request';

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly request: TenantRequest) {}

  get user(): AuthenticatedUser {
    if (!this.request.user) {
      throw new UnauthorizedException();
    }

    return this.request.user;
  }

  get tenantId(): string {
    return this.user.tenantId;
  }
}
