# Roadmap

The first version focuses on the package baseline: module registration,
injection, repository providers, transaction decorator bridges, testing helpers,
coverage gates, performance reporting, cognitive complexity reporting, release
checks, and security checks.

Next priorities:

- Additional focused samples for driver-specific setup.
- Keep class-validator DTOs and `ValidationPipe` as the canonical Nest-native
  HTTP validation path.
- Evaluate whether the optional Drizzle-Zod/OpenAPI bridge sample justifies a
  tiny helper, or whether the app-owned pattern is clearer as documentation.

The package should stay conservative while these pieces are added. New APIs
should prove they are useful in samples or integration tests before becoming
part of the public surface.
