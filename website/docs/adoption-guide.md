---
title: Adoption Guide
description: Move an existing Nest and Drizzle application onto @nest-native/drizzle incrementally.
---

# Adoption Guide

Adopt `@nest-native/drizzle` in small steps. The package should replace manual
Nest provider wiring, not your Drizzle schemas or query style.

## Start With One Client

Before:

```ts
export const DATABASE = Symbol('DATABASE');

@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: () => drizzle(pool, { schema }),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
```

After:

```ts
@Module({
  imports: [
    DrizzleModule.forRoot({
      schema,
      connection: drizzle(pool, { schema }),
      shutdown: () => pool.end(),
    }),
  ],
})
export class DatabaseModule {}
```

Consumers can move from custom tokens to `@InjectDrizzle()` one provider at a
time.

## Keep Schemas Unchanged

Do not rewrite Drizzle schemas as classes or decorators. Keep standard Drizzle
table definitions in place and pass the schema object into `DrizzleModule`.

```ts
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
});
```

## Introduce Repositories Gradually

Use repositories when query code is shared or complex. Leave simple services
with direct `@InjectDrizzle()` injection until a repository boundary improves
the design.

```ts
@DrizzleRepository()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });
  }
}
```

Register repositories through `DrizzleModule.forFeature()` in the feature
module that owns them.

## Migrate Validation Separately

Do not mix database provider adoption with validation rewrites. Keep existing
DTOs, pipes, and Swagger decorators working first. Move to optional
`drizzle-zod` patterns only in a separate PR if the application has chosen that
validation style.

## Add Transactions Last

`@Transactional()` relies on the CLS transaction stack. Add it after the Drizzle
client is registered through package tokens and after the service boundary is
clear.

The usual order is:

1. Register the Drizzle client with `DrizzleModule`.
2. Move shared query code into repositories.
3. Add real integration tests for the workflows that need rollback.
4. Configure `@nestjs-cls/transactional`.
5. Add `@Transactional()` at service methods that own the unit of work.

## Migration PR Shape

Keep adoption PRs narrow:

- One database module or feature module at a time.
- No schema rewrites.
- No broad validation migration in the same PR.
- No raw SQL string interpolation.
- Include a smoke test or focused unit test for the moved provider boundary.

This keeps the migration reversible and makes review about Nest integration
rather than unrelated application behavior.
