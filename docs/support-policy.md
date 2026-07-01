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

### Drizzle ORM v1 (release candidate)

Drizzle ORM v1 is currently a release candidate (`1.0.0-rc.x`); the stable
`latest` tag is still on the `0.45.x` line. `@nest-native/drizzle` holds no
direct dependency on Drizzle internals, but v1 ships breaking changes and its
ecosystem is not ready yet, so v1 is **not supported today**:

- Relational Queries v2 replaces the `drizzle(client, { schema })` config shape,
  so schema-typed clients and the driver/integration tests no longer type-check
  against v1 without changes.
- `@nestjs-cls/transactional-adapter-drizzle-orm` peer-pins `drizzle-orm@^0`, so
  `@Transactional()` / `@InjectTransaction()` cannot run on v1 until that adapter
  adds v1 support.
- `drizzle-zod` has no stable v1 release, so the optional Drizzle-Zod validation
  path does not type-check against v1.

A non-blocking CI job (`drizzle-orm v1 RC compatibility`) installs
`drizzle-orm@rc` on every push and runs the package tests as an early-warning
signal. When it goes green, the peer range and this policy will be updated to
declare v1 support. Until then, stay on the `0.45.x` line.

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
