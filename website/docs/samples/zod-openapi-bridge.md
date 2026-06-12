---
title: Zod + Swagger/OpenAPI Bridge
description: App-owned Drizzle-Zod validation with explicit Swagger/OpenAPI DTO contracts.
---

# Zod + Swagger/OpenAPI Bridge

The default HTTP contract story for this library is still Nest DTO classes,
`ValidationPipe`, and `@nestjs/swagger`. Use the Drizzle-Zod bridge only when an
application has deliberately chosen schema-derived validation and wants to keep
that choice visible at the route boundary.

The bridge is app-owned. `@nest-native/drizzle` supplies the Drizzle client,
repository registration, and transaction hooks; your application owns the Zod
schema, Nest pipe, Swagger DTOs, and OpenAPI assertions.

## When To Use It

Use this pattern when:

- The incoming request body should closely track a Drizzle insert or update
  schema.
- Runtime validation should be derived from the Drizzle table with
  `drizzle-zod`.
- The public OpenAPI contract should stay explicit and easy for Nest developers
  to inspect.
- Tests can assert that the Zod input keys and documented DTO properties stay in
  sync.

Prefer class-validator DTOs when the HTTP contract differs meaningfully from the
table shape, when the team wants the canonical Nest validation path, or when the
extra Zod dependency is not already part of the application.

## Install App Dependencies

The package does not require Zod for normal use. Install these in the
application or sample that owns the bridge:

```bash
npm i drizzle-zod zod @nestjs/swagger
```

## Derive The Runtime Schema

Start from the Drizzle table, omit database-owned fields, then add route-level
rules. Keep this in application code so the validation behavior remains obvious.

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

Use `.strict()` when request bodies should reject unknown keys. That keeps the
route boundary tight and avoids silently accepting fields the API does not
document.

## Validate At The Route Boundary

A small Nest pipe is enough for this app-owned pattern:

```ts
import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { type ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<TInput = unknown, TOutput = unknown>
  implements PipeTransform<TInput, TOutput>
{
  constructor(private readonly schema: ZodType<TOutput, TInput>) {}

  transform(value: TInput): TOutput {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        issues: result.error.issues,
      });
    }

    return result.data;
  }
}
```

## Keep Swagger DTOs Explicit

The Zod schema owns runtime validation. The DTO class owns the public OpenAPI
shape:

```ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Document schema-derived validation',
    minLength: 3,
    maxLength: 120,
  })
  title!: string;

  @ApiProperty({
    example: 'ada@example.com',
    format: 'email',
  })
  requesterEmail!: string;

  @ApiProperty({
    enum: ['low', 'normal', 'urgent'],
    example: 'urgent',
  })
  priority!: 'low' | 'normal' | 'urgent';

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 13,
  })
  estimatePoints!: number;
}
```

That duplication is intentional in the current package. It keeps the public API
contract readable, keeps Zod optional, and avoids promoting a broad helper API
before repeated samples prove it is worth the public surface area.

## Wire The Controller

Use the Zod pipe for validation and the DTO class for Swagger:

```ts
import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTicketDto } from './create-ticket.dto';
import { TicketDto } from './ticket.dto';
import {
  createTicketSchema,
  type CreateTicketInput,
} from './ticket.validation';
import { TicketsService } from './tickets.service';
import { ZodValidationPipe } from '../zod-validation.pipe';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createTicketSchema))
  @ApiBody({ type: CreateTicketDto })
  @ApiCreatedResponse({ type: TicketDto })
  @ApiBadRequestResponse({ description: 'Zod validation failed' })
  create(@Body() body: CreateTicketInput): Promise<TicketDto> {
    return this.ticketsService.create(body);
  }
}
```

Repositories and services still receive typed data and write ordinary Drizzle
queries. Do not interpolate raw request strings into SQL; keep values flowing
through Drizzle query builders or the `sql` template parameters.

## Test The Contract

The focused sample asserts three things:

- Invalid payloads fail before database writes.
- Valid payloads persist through real Drizzle queries.
- OpenAPI request properties match the Zod input keys.

Run the sample directly:

```bash
npm run test --workspace nest-drizzle-native-sample-13-zod-openapi-bridge
```

Inspect the implementation:

- [`sample/13-zod-openapi-bridge/src/tickets/ticket.validation.ts`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/13-zod-openapi-bridge/src/tickets/ticket.validation.ts)
- [`sample/13-zod-openapi-bridge/src/tickets/tickets.controller.ts`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/13-zod-openapi-bridge/src/tickets/tickets.controller.ts)
- [`sample/13-zod-openapi-bridge/scripts/smoke.ts`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/13-zod-openapi-bridge/scripts/smoke.ts)

## Public Helper Boundary

There is intentionally no `@nest-native/drizzle/zod` export today. A helper can
be considered later only if more focused samples show the same boilerplate
repeating and a small Nest-native helper can remove that friction without making
Zod a default dependency or hiding the Drizzle and Zod primitives. See
[Zod Helper Evaluation](zod-helper-evaluation.md) for the current decision.
