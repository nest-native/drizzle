# Roadmap

The first version focuses on the package baseline: module registration,
injection, repository providers, transaction decorator bridges, testing helpers,
coverage gates, performance reporting, cognitive complexity reporting, release
checks, and security checks.

Planned follow-up work:

- Additional focused samples for driver-specific setup.
- Driver integration suites for PostgreSQL, MySQL, SQLite, and libSQL.
- Drizzle-Zod and Swagger helpers for single-source-of-truth DTO/OpenAPI flows.
- Documentation site deployment once the sample set is ready.

The package should stay conservative while these pieces are added. New APIs
should prove they are useful in samples or integration tests before becoming
part of the public surface.
