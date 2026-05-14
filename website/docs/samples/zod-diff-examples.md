---
title: Zod Diff Examples
description: Before and after examples for app-owned Drizzle-Zod validation with explicit Swagger DTOs.
---

# Zod Diff Examples

These examples show how to move from scattered raw `drizzle-zod` usage toward
the app-owned bridge. The Drizzle schema does not change. The controller makes
validation explicit, and Swagger DTOs keep the public API contract readable.

## Basic Create DTO

Before:

```ts
import { createInsertSchema } from 'drizzle-zod';
import { users } from '../schema';

export const createUserSchema = createInsertSchema(users);
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

After:

```ts
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../schema';

export const createUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    passwordHash: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    password: z.string().min(8).max(128),
  })
  .strict();

export const createUserInputKeys = createUserSchema.keyof().options;
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

Swagger stays explicit:

```ts
export class CreateUserDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  password!: string;
}
```

## Relation Response

Before:

```ts
const postWithAuthorSchema = createSelectSchema(posts).extend({
  author: createSelectSchema(users),
});
```

After:

```ts
export const postWithAuthorSchema = createSelectSchema(posts)
  .omit({
    deletedAt: true,
  })
  .extend({
    author: createSelectSchema(users).omit({
      passwordHash: true,
    }),
  });
```

Document the response with DTO classes that match the public shape:

```ts
export class AuthorDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;
}

export class PostWithAuthorDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: AuthorDto })
  author!: AuthorDto;
}
```

## Many-To-Many Input

Before:

```ts
const createPostSchema = createInsertSchema(posts);
```

After:

```ts
export const createPostSchema = createInsertSchema(posts)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    tagIds: z.array(z.number().int().positive()).min(1),
  })
  .strict();

export type CreatePostInput = z.infer<typeof createPostSchema>;
```

Use a request DTO that documents the application-level relation input rather
than the join table:

```ts
export class CreatePostDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: Number, isArray: true, minimum: 1 })
  tagIds!: number[];
}
```

The repository can then write the post and join rows in a transaction. Keep
values parameterized through Drizzle and avoid raw string interpolation.

## Controller Diff

Before:

```ts
@Post()
create(@Body() body: CreatePostInput) {
  return this.postsService.create(body);
}
```

After:

```ts
@Post()
@UsePipes(new ZodValidationPipe(createPostSchema))
@ApiBody({ type: CreatePostDto })
@ApiCreatedResponse({ type: PostWithTagsDto })
@ApiBadRequestResponse({ description: 'Zod validation failed' })
create(@Body() body: CreatePostInput) {
  return this.postsService.create(body);
}
```

The route now shows the complete contract: Zod validates input, Swagger DTOs
document the request and response, and the service receives typed data.
