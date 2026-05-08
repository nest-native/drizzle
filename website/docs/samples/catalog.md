# Sample Catalog

Runnable samples use local libSQL files and can run without external services.

```bash
npm run ci:sample
npm run sample:focused
```

## Runnable Today

| Sample | Focus | Command |
| --- | --- | --- |
| [`00-showcase`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/00-showcase) | Full Nest-native integration baseline | `npm run showcase` |
| [`01-basic-client-injection`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/01-basic-client-injection) | Direct `@InjectDrizzle()` client injection | `npm run test --workspace nest-drizzle-native-sample-01-basic-client` |
| [`02-repositories`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/02-repositories) | `@DrizzleRepository()` and `DrizzleModule.forFeature()` | `npm run test --workspace nest-drizzle-native-sample-02-repositories` |
| [`03-for-root-async`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/03-for-root-async) | Async configuration and shutdown hooks | `npm run test --workspace nest-drizzle-native-sample-03-for-root-async` |
| [`04-named-connections`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/04-named-connections) | Multiple Drizzle clients in one app | `npm run test --workspace nest-drizzle-native-sample-04-named-connections` |
| [`05-transactions-cls`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/05-transactions-cls) | CLS-backed `@Transactional()` commit and rollback | `npm run test --workspace nest-drizzle-native-sample-05-transactions-cls` |
| [`06-manual-transaction`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/06-manual-transaction) | `@InjectTransaction()` escape hatch | `npm run test --workspace nest-drizzle-native-sample-06-manual-transaction` |
| [`07-validation-drizzle-zod`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/07-validation-drizzle-zod) | Drizzle schema to Zod validation | `npm run test --workspace nest-drizzle-native-sample-07-validation-drizzle-zod` |
| [`08-validation-class-validator`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/08-validation-class-validator) | DTO validation with `ValidationPipe` | `npm run test --workspace nest-drizzle-native-sample-08-validation-class-validator` |
| [`09-error-mapping`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/09-error-mapping) | Opt-in database error mapping | `npm run test --workspace nest-drizzle-native-sample-09-error-mapping` |
| [`10-testing-utilities`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/10-testing-utilities) | Test module and mock helpers | `npm run test --workspace nest-drizzle-native-sample-10-testing-utilities` |
| [`11-raw-sql-escape-hatch`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/11-raw-sql-escape-hatch) | Safe raw SQL patterns | `npm run test --workspace nest-drizzle-native-sample-11-raw-sql-escape-hatch` |
| [`12-swagger-openapi`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/12-swagger-openapi) | Swagger/OpenAPI integration | `npm run test --workspace nest-drizzle-native-sample-12-swagger-openapi` |
| [`13-zod-openapi-bridge`](https://github.com/rodrigobnogueira/nest-drizzle-native/tree/main/sample/13-zod-openapi-bridge) | Optional Drizzle-Zod validation with Swagger contracts | `npm run test --workspace nest-drizzle-native-sample-13-zod-openapi-bridge` |
