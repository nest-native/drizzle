---
title: Deployment
description: Production deployment checklist for Nest applications using nest-drizzle-native.
---

# Deployment

`nest-drizzle-native` keeps deployment decisions in your application. The
package wires Drizzle into Nest; your app still owns driver configuration,
migrations, health checks, and runtime environment.

## Minimal Release Flow

1. Build and typecheck the application.
2. Generate migrations from Drizzle schema changes.
3. Commit generated SQL and migration metadata.
4. Apply migrations once before serving traffic.
5. Start the Nest app with production connection settings.
6. Route traffic only after readiness succeeds.

## Environment

Keep database configuration in application code:

- connection URLs and secrets
- TLS settings
- pool sizing and timeouts
- driver-specific options
- named connection selection

Pass a ready Drizzle client to `DrizzleModule.forRoot()` and provide `shutdown`
when the Nest app owns the driver or pool lifecycle.

## Migrations Before Traffic

Run Drizzle migrations as a deployment step or a controlled single-runner
startup phase. Avoid letting every replica race to apply migrations during a
scale-out event.

The package intentionally does not hide Drizzle's migration model behind a Nest
abstraction. See the
[`17-drizzle-kit-migrations`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/17-drizzle-kit-migrations)
sample for the app-owned pattern, and see
[Migration Operations](migration-operations.md) for release-job, multi-replica,
backfill, and readiness guidance.

## Health Checks

Expose two different signals:

- `/health/live`: process is up; do not query the database
- `/health/ready`: process is ready for traffic; run a cheap Drizzle-backed
  check

Readiness should fail closed when the database or required migration state is
unavailable. See the
[`18-health-readiness`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/18-health-readiness)
sample for a minimal implementation.

### Optional Terminus Integration

If your application already uses
[`@nestjs/terminus`](https://docs.nestjs.com/recipes/terminus), keep the
Drizzle readiness logic app-owned and wrap it in a custom Terminus indicator.
Do not add Terminus to `nest-drizzle-native` itself; health policy belongs to
the application.

```ts
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
export class DrizzleHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly healthRepository: HealthRepository,
  ) {}

  async isHealthy(key = 'database') {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.healthRepository.checkReady();
      return indicator.up();
    } catch {
      return indicator.down({ reason: 'unavailable' });
    }
  }
}
```

Then use the indicator only from readiness:

```ts
@Get('ready')
@HealthCheck()
ready() {
  return this.health.check([
    () => this.drizzleHealthIndicator.isHealthy(),
  ]);
}
```

Keep liveness process-only, even when Terminus is installed. Readiness failures
should stay generic: do not return connection strings, hostnames, SQL text,
driver errors, or migration internals in health responses.

## Deployment Checklist

- `DATABASE_URL` or equivalent secret is configured by the platform.
- The app creates the driver or pool explicitly.
- `shutdown` closes owned resources.
- Migrations run once before traffic.
- Liveness and readiness endpoints are configured in the platform.
- Transaction boundaries live on workflow services.
- Raw SQL uses Drizzle's `sql` template with parameterized values.
- CI runs package checks, docs build, and sample validation before release.
