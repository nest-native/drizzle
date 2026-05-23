export interface AuthenticatedUser {
  readonly id: string;
  readonly tenantId: string;
  readonly displayName: string;
}
