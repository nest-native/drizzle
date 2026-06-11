# Repositories

`@DrizzleRepository()` marks a plain class as a Drizzle-oriented provider. It
does not create an Active Record layer, hide SQL, or replace Drizzle's type
inference. The decorator exists so repository classes have an explicit Nest
integration role and can later carry connection metadata.

```ts
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';

@DrizzleRepository()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  findMany() {
    return this.db.query.users.findMany();
  }
}
```

Register repositories with `DrizzleModule.forFeature()`.

```ts
@Module({
  imports: [DrizzleModule.forFeature([UsersRepository])],
  exports: [UsersRepository],
})
export class UsersDataModule {}
```

For a runnable version of this pattern, see the
[repository sample](samples/catalog.md).

## Direct Client Injection

Use `@InjectDrizzle()` when a service naturally owns the query code.

```ts
@Injectable()
export class ReportsService {
  constructor(@InjectDrizzle() private readonly db: AnalyticsDatabase) {}
}
```

Use a repository when query code is shared, reused by multiple services, or
complex enough to deserve a focused provider.

## Named Connections

Register a named connection:

```ts
DrizzleModule.forRoot({
  connectionName: 'analytics',
  schema: analyticsSchema,
  connection: analyticsDb,
});
```

Inject it with the same name:

```ts
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectDrizzle('analytics')
    private readonly db: AnalyticsDatabase,
  ) {}
}
```

## Repository Boundaries

Good repository methods usually describe domain-specific reads or writes:

- `findById(id)`
- `findActiveSubscriptions(customerId)`
- `createInvoice(input)`
- `markInvoicePaid(invoiceId)`

Avoid wrapping every Drizzle method one-for-one. That adds noise while reducing
the clarity that Drizzle already provides.
