export function createDrizzleMockClient<
  TClient extends Record<PropertyKey, unknown> = Record<string, unknown>,
>(overrides: Partial<TClient> = {}): TClient {
  return { ...overrides } as TClient;
}

export function createDrizzleRepositoryMock<
  TRepository extends Record<PropertyKey, unknown>,
>(methods: Partial<TRepository>): TRepository {
  return { ...methods } as TRepository;
}
