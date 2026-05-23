import type { IncomingHttpHeaders } from 'node:http';
import type { AuthenticatedUser } from './authenticated-user';

export interface TenantRequest {
  headers: IncomingHttpHeaders;
  user?: AuthenticatedUser;
}
