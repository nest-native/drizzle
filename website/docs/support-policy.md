# Support Policy

`@nest-native/drizzle` is a community package and does not claim official NestJS
or Drizzle ORM status.

## Supported Runtime Lines

| Runtime | Supported line |
| --- | --- |
| Node.js | `>=20` |
| NestJS | `11.x` |
| Drizzle ORM | `>=0.30.0 <2.0.0` |
| TypeScript | Current project compiler line |

Drivers are optional peers. Install and test the driver your application uses.

## Public API Tiers

Primary application APIs:

- `DrizzleModule`
- `@InjectDrizzle()`
- `@DrizzleRepository()`
- `@Transactional()`
- `@InjectTransaction()`

Testing APIs:

- `DrizzleTestModule`
- `createDrizzleMockClient()`
- `createDrizzleRepositoryMock()`

Advanced integration APIs:

- token helpers such as `getDrizzleClientToken()`
- `DrizzleConnectionManager`
- error mapper helpers

Prefer primary APIs in normal application code. Use advanced APIs only when an
external integration or focused test needs the exact internal provider contract.

## Dependency Policy

The published package keeps `"dependencies": {}` empty. Runtime integrations
belong in `peerDependencies`, and package-local build/test tools belong in
`devDependencies`.

This avoids pulling a second Nest runtime, a surprise database driver, or an
unused transaction stack into host applications.

## Security Expectations

Security review should cover:

- dependency additions and lockfile churn
- install and lifecycle scripts
- driver configuration examples
- secret leakage in docs, samples, and tests
- unsafe dynamic execution or deserialization
- injection surfaces in SQL, paths, commands, and templates

High-risk findings should block merge until they are mitigated or explicitly
accepted by maintainers.
