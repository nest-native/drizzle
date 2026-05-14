---
title: Zod Migration Guide
description: Migrate raw drizzle-zod validation toward the app-owned Zod OpenAPI bridge.
---

# Zod Migration Guide

This guide is for applications that already use `drizzle-zod` and want a
clearer Nest HTTP boundary without adopting a new package API. The target shape
is the app-owned bridge from the [Zod OpenAPI Bridge](./zod-openapi-bridge.md)
page:

- Drizzle tables remain the database source of truth.
- `drizzle-zod` derives runtime request validation.
- Explicit Swagger DTO classes document the public API contract.
- Controllers make the validation and documentation choices visible.

There is no `nest-drizzle-native/zod` import in this migration. Keep the bridge
inside the application until repeated samples prove that a tiny public helper is
worth adding.

## 1. Install App-Owned Dependencies

```bash
npm i drizzle-zod zod @nestjs/swagger
```

These dependencies belong to the application or sample that uses the bridge.
They are not required for normal `nest-drizzle-native` usage.

## 2. Move Validation Into A Named Schema File

Before:

```ts
import { createInsertSchema } from 'drizzle-zod';
import { supportTickets } from '../schema';

export const createTicketSchema = createInsertSchema(supportTickets);
```

After:

```ts
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { supportTickets } from '../schema';

export const createTicketSchema = createInsertSchema(supportTickets)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    title: z.string().trim().min(3).max(120),
    requesterEmail: z.email(),
    priority: z.enum(['low', 'normal', 'urgent']),
    estimatePoints: z.int().min(1).max(13),
  })
  .strict();

export const createTicketInputKeys = createTicketSchema.keyof().options;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
```

Use `.omit()` for database-owned fields and `.strict()` for route inputs that
should reject undocumented properties.

## 3. Keep Swagger DTOs Explicit

Before:

```ts
@Post()
create(@Body() body: CreateTicketInput) {
  return this.ticketsService.create(body);
}
```

After:

```ts
export class CreateTicketDto {
  @ApiProperty({ minLength: 3, maxLength: 120 })
  title!: string;

  @ApiProperty({ format: 'email' })
  requesterEmail!: string;

  @ApiProperty({ enum: ['low', 'normal', 'urgent'] })
  priority!: 'low' | 'normal' | 'urgent';

  @ApiProperty({ minimum: 1, maximum: 13 })
  estimatePoints!: number;
}
```

The DTO class is intentionally separate from the Zod schema. That makes the
OpenAPI contract easy to inspect in a normal Nest project and keeps the package
from forcing a validation ecosystem.

## 4. Validate In The Controller

```ts
@Post()
@UsePipes(new ZodValidationPipe(createTicketSchema))
@ApiBody({ type: CreateTicketDto })
@ApiCreatedResponse({ type: TicketDto })
@ApiBadRequestResponse({ description: 'Zod validation failed' })
create(@Body() body: CreateTicketInput): Promise<TicketDto> {
  return this.ticketsService.create(body);
}
```

The controller shows the two contracts side by side:

- `ZodValidationPipe(createTicketSchema)` validates runtime input.
- `@ApiBody({ type: CreateTicketDto })` documents the public request body.

## 5. Add Contract Tests

Add smoke coverage before migrating many endpoints:

- Invalid payloads are rejected before repository writes.
- Valid payloads persist through real Drizzle queries.
- OpenAPI request properties match `createTicketInputKeys`.
- Response DTOs do not expose secrets, hashes, or internal database columns.

Run the focused sample as a reference:

```bash
npm run test --workspace nest-drizzle-native-sample-13-zod-openapi-bridge
```

## 6. Repeat Endpoint By Endpoint

Keep each PR small:

- One feature module, or a few closely related DTOs.
- No unrelated repository refactors.
- No package-level helper extraction during the migration.
- A smoke test or OpenAPI assertion for every public route shape.

When the same local glue appears in multiple focused samples, write a
post-sample review. Only then consider whether a small optional helper belongs
in the package.
