# Sample 18: Health and Readiness

This sample shows a small production readiness pattern for Nest applications
using `nest-drizzle-native`.

Liveness answers whether the process is running. Readiness answers whether the
application should receive traffic, including a cheap Drizzle-backed database
check.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Liveness endpoint without database work | `src/health/health.controller.ts` |
| Readiness endpoint backed by an injected repository | `src/health/health.service.ts` |
| Cheap database readiness query | `src/health/health.repository.ts` |
| Driver construction and shutdown | `src/database.ts`, `src/app.module.ts` |
| HTTP smoke test for `/health/live` and `/health/ready` | `scripts/smoke.ts` |

## Run

```bash
npm run start --workspace nest-drizzle-native-sample-18-health-readiness
```

## Validate

```bash
npm run test --workspace nest-drizzle-native-sample-18-health-readiness
```

## Why This Matters

Deployment platforms need a fast way to know whether a process is alive and
whether it is safe to route traffic to it. Keep these checks explicit:

- liveness should not depend on the database
- readiness may depend on the database, migrations, or required startup state
- readiness queries should be cheap and parameterized
- readiness should fail closed when database state is unavailable

This sample avoids extra health-check dependencies so the core pattern is clear.
Applications that use `@nestjs/terminus` can wrap the same repository check in a
Terminus health indicator. Keep Terminus app-owned: import `TerminusModule`,
create a small custom indicator around `HealthRepository.checkReady()`, and use
that indicator only from readiness. Do not return connection strings, hostnames,
SQL text, driver errors, or migration internals in health responses.

## Post-Sample Review

- Library ergonomics: no package API change needed. Health checks are app-level
  deployment policy and can use normal repository injection.
- Architecture: keep liveness and readiness separate. Liveness should not query
  the database; readiness should prove the app can serve traffic.
- Documentation: production docs should include health checks next to
  migrations, shutdown, and transaction guidance.
- Performance: readiness uses a single cheap read. Avoid expensive aggregate
  queries or writes in load-balancer health checks.
- Maintainability: no shared sample helper needed yet.
