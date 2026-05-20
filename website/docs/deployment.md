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
sample for the app-owned pattern.

## Health Checks

Expose two different signals:

- `/health/live`: process is up; do not query the database
- `/health/ready`: process is ready for traffic; run a cheap Drizzle-backed
  check

Readiness should fail closed when the database or required migration state is
unavailable. See the
[`18-health-readiness`](https://github.com/nest-native/nest-drizzle-native/tree/main/sample/18-health-readiness)
sample for a minimal implementation.

## Deployment Checklist

- `DATABASE_URL` or equivalent secret is configured by the platform.
- The app creates the driver or pool explicitly.
- `shutdown` closes owned resources.
- Migrations run once before traffic.
- Liveness and readiness endpoints are configured in the platform.
- Transaction boundaries live on workflow services.
- Raw SQL uses Drizzle's `sql` template with parameterized values.
- CI runs package checks, docs build, and sample validation before release.
