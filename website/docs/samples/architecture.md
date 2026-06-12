# Sample Architecture

The samples deliberately use ordinary Nest building blocks.

`00-showcase` is the full reference app. The focused samples then isolate each
piece of the same architecture.

## Root Modules Own Connections

The app module registers database clients with `DrizzleModule.forRoot()` or
`DrizzleModule.forRootAsync()`. Driver lifecycle stays close to the connection:

- create the Drizzle client in the root module
- pass the schema object as-is
- close owned drivers with `shutdown`
- use `connectionName` for multi-database apps

See [`00-showcase`](https://github.com/nest-native/drizzle/tree/main/sample/00-showcase),
[`03-for-root-async`](https://github.com/nest-native/drizzle/tree/main/sample/03-for-root-async), and
[`04-named-connections`](https://github.com/nest-native/drizzle/tree/main/sample/04-named-connections).

## Feature Modules Own Repositories

Repositories are normal Nest providers. Register them with
`DrizzleModule.forFeature()` inside the feature module that owns the use case.
This keeps dependency injection familiar while leaving Drizzle queries explicit.

See [`02-repositories`](https://github.com/nest-native/drizzle/tree/main/sample/02-repositories).

## Services Own Workflows

Services coordinate multi-step behavior. Repositories stay focused on query
shape, while services decide transaction boundaries and orchestration.

See [`05-transactions-cls`](https://github.com/nest-native/drizzle/tree/main/sample/05-transactions-cls).

## Escape Hatches Stay Explicit

Direct transaction injection is available, but it should remain an escape hatch
for low-level providers that truly need the active transaction object.

See [`06-manual-transaction`](https://github.com/nest-native/drizzle/tree/main/sample/06-manual-transaction).

## Tests Prove Real Behavior

Focused samples use smoke tests against real local libSQL clients. Mocks are
reserved for unit tests where SQL behavior is intentionally out of scope.
