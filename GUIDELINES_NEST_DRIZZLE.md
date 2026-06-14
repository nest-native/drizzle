# GUIDELINES_NEST_DRIZZLE.md

## Core Philosophy - This library MUST feel native in NestJS projects

Every single decision must follow NestJS philosophy exactly as `@nestjs/graphql`,
`@nestjs/websockets`, and `@nestjs/typeorm` do, **while staying true to Drizzle
ORM's functional, SQL-first, anti-magic nature**.

### 1. Overall Architecture Assumptions (never break these)

- It is a **first-class NestJS integration** package, not a thin wrapper around
  Drizzle.
- Everything must be decorator-first, OOP-oriented, and heavily use NestJS DI.
- Mirror the DX of `@nestjs/typeorm` and `@nestjs/graphql` while preserving
  Drizzle's explicit functional style.
- Current stabilization support line:
  - Node.js `>=20`
  - NestJS `11.x`
  - Drizzle ORM `>=0.30.0 <2.0.0` until Drizzle v1 stabilizes
  - PostgreSQL, MySQL, SQLite, and libSQL-compatible drivers (`pg`, `mysql2`,
    `better-sqlite3`, `@libsql/client`, etc.)
- Full integration with NestJS enhancer pipeline is **NON-NEGOTIABLE**:
  - `@UseGuards`, `@UseInterceptors`, `@UsePipes`, `@UseFilters` must work on
    repositories, services, and controllers.
  - Request-scoped providers, async providers, and `REQUEST` injection must work
    seamlessly.
- Adapter-agnostic: zero code changes needed when switching between Express and
  Fastify.
- Support both validation worlds without forcing one:
  - `class-validator` + DTOs + `ValidationPipe` as the canonical Nest-native
    HTTP validation path
  - `drizzle-zod` as an optional schema-derived validation path for teams that
    deliberately choose it

### 2. Public API Assumptions (this is what users will copy-paste)

- Primary onboarding API:
  - `DrizzleModule.forRoot({ schema, connection, ... })`
  - `DrizzleModule.forRootAsync()`
  - `DrizzleModule.forFeature([RepositoryClass])`
- Decorators:
  - `@InjectDrizzle()` for direct client injection
  - `@DrizzleRepository()` on repository classes
  - `@Transactional()` built **strictly** on top of `@nestjs-cls/transactional`
  - `@InjectTransaction()` for accessing current transaction context when manual
    escape hatches are needed
- **Schema Definition**: Users **must** define schemas using standard Drizzle
  functional syntax. There are **NO** class-based entities or decorator-driven
  schema definitions.
- Repositories should expose both a convenient high-level API and a full escape
  hatch to the raw Drizzle query builder / `sql` template.
- Strong integration with standard Nest DTOs, `class-validator`, and
  `@nestjs/swagger`.
- Optional `drizzle-zod` patterns must be proven through samples before any
  public helper API is considered.
- Advanced testing API (keep clean separation):
  - Provide excellent testing utilities (e.g., `DrizzleTestModule`, repository
    spies, transaction test helpers).
  - Avoid polluting quick-start docs with testing internals.

### 3. First-Version Scope Discipline

- The first version may ship in layers, but docs must be honest about what is
  implemented today.
- Current core scope:
  - `DrizzleModule.forRoot()`, `forRootAsync()`, and `forFeature()`
  - connection, schema, and named-client provider tokens
  - `@InjectDrizzle()` and `@DrizzleRepository()`
  - `@Transactional()` / `@InjectTransaction()` bridges to
    `@nestjs-cls/transactional`
  - explicit error-mapping helpers
  - `DrizzleTestModule` and small mock helpers
  - CI for build, typecheck, coverage, cognitive complexity, pack validation,
    and supply-chain audit
- Do not claim Swagger generation, driver integration tests, or showcase samples
  are complete until they exist in the repository.

### 4. Sample Folder Rules

- `sample/00-showcase` must demonstrate:
  - Feature modules with repositories + services + controllers
  - Constructor DI, including request-scoped services
  - Guards, interceptors, pipes, and filters
  - `@Transactional()` usage across multiple injected services
  - Mixed validation with class-validator DTOs as the default and `drizzle-zod`
    only as an optional companion path
  - Express + Fastify mains
  - Full OpenAPI/Swagger integration with generated schemas
  - Database seeding and test utilities
- Focused samples under `sample/01-*`, `sample/02-*`, etc. should isolate one
  topic with minimal noise.
- Never simplify the full showcase for brevity - richness proves the integration
  depth.

### 5. Implementation Rules

- All repositories are plain classes decorated with `@DrizzleRepository()` or
  `@Injectable()`.
- Use NestJS metadata reflection and module discovery when it adds real Nest
  behavior. Avoid discovery-driven magic that makes provider registration hard
  to reason about.
- **Transactions**: Must feel natural in Nest. Rely on the `@Transactional()`
  decorator powered by `@nestjs-cls/transactional` + Drizzle adapter.
- **Keep abstractions thin**: Repositories are structured homes for queries,
  **never** opaque Active Record layers. Users should still feel they are writing
  real Drizzle.
- Always expose the raw Drizzle client and query builder for complex cases.
- Exception mapping: Provide optional helpers to map common Drizzle errors to
  NestJS exceptions, but **do not** do it automatically by default.
- Schema handling: The module receives the user's standard Drizzle schema object
  **as-is**. Do not transform it.
- Keep the package lean - minimal runtime dependencies in the published library.
  Push database drivers to optional `peerDependencies`.
- Do not promote Zod-related helpers into root exports or required dependencies
  unless a sample-first review explicitly proves that the helper improves the
  Nest-native experience more than it expands the public surface.
- Never expose Drizzle internals or library implementation details unless the
  user opts in via advanced config.

### 6. Non-Negotiable Style & Patterns

- Use NestJS naming conventions (`@nestjs/common` style).
- Prefer constructor injection over module-level providers when possible.
- Always support global, module, and method-level enhancers.
- Tests must cover enhancer pipeline, request scoping, transaction isolation, and
  multiple drivers as those features land.
- Documentation and README should follow Nest-style clarity without claiming
  official NestJS or Drizzle status.
- Preserve clear API tiers: onboarding focuses on `DrizzleModule`, main
  decorators, and repository pattern. Advanced features stay in dedicated
  sections.

### 7. When In Doubt

- Ask: "Would this feel natural in a `@nestjs/typeorm` or `@nestjs/graphql`
  project while still feeling like real Drizzle?"
- If the answer is no, redesign it until the answer is yes.
- Prioritize developer experience **without** compromising Drizzle's performance
  and explicitness.

Follow these assumptions in **EVERY** file you generate or modify. This is the
project constitution.

### 8. Differentiation Strategy

- Deliver the best Nest-native experience for Drizzle (decorators + DI +
  enhancers).
- Solve the transaction problem elegantly (`@Transactional()` across services via
  AsyncLocalStorage).
- Keep DTOs + `ValidationPipe` + `@nestjs/swagger` as the default Nest-native
  HTTP contract story.
- Explore schema -> Zod -> OpenAPI flows only as optional sample-first design.
  Prefer small helpers only when they remove real application friction without
  hiding Drizzle, Zod, or NestJS concepts.
- Stay thin, explicit, and performant - users should feel they are using
  Drizzle, just beautifully integrated into NestJS.

### 9. Security Review Requirements (MANDATORY)

- Every PR analysis must include an explicit security pass.
- Supply-chain checks are NON-NEGOTIABLE.
- Runtime requirements belong in `peerDependencies`.
- Application security checks must verify:
  - SQL injection risks. Raw SQL helpers must never encourage unsafe string
    interpolation.
  - Transaction context leaks. Contexts must be strictly bounded to the
    request/method.
  - Secret leakage in code, tests, sample files, logs, and documentation.

### 10. Release Version Synchronization (MANDATORY)

- Version drift between `packages/drizzle` and `sample/*` is a release blocker
  once samples exist.
- When bumping version in `packages/drizzle/package.json`, update ALL
  `sample/*/package.json` entries for `"@nest-native/drizzle"` in the same
  change.
- Regenerate `package-lock.json` after version alignment (`npm install`) once the
  repository has a lockfile.
- `npm run release:check` is a release blocker.
- Post-publish: re-run full CI with samples pinned to the published version.

### 11. Cognitive Complexity Review

- When changes touch `packages/drizzle/**/*.ts`, AI agents should run
  `npm run complexity:check` and `npm run complexity:report`.
- CI enforces SonarJS' default cognitive-complexity threshold of `15` per package
  source function.
- Treat the PR complexity report as a review signal for deltas and hotspots, not
  an automatic refactor mandate.
- Do not reduce complexity by weakening Nest-native architecture, public API
  clarity, transaction safety, or test coverage.

### 12. Accumulated Project Decisions

- **Sample-first API design**: Prove new helper ideas in focused samples before
  adding public library API. The sample should make the pain visible and show
  that the proposed helper is smaller than the problem it solves.
- **Keep helpers simple and useful**: Prefer explicit Nest-native utilities over
  magical code generation, hidden runtime metadata, or broad abstractions that
  make Drizzle feel less direct.
- **Separate sample PRs from library fixes**: If a sample exposes a package bug
  or architectural issue, stash or pause the sample work, fix the library in its
  own PR, then resume the sample.
- **Post-sample review is mandatory**: After every sample, evaluate whether the
  main library, architecture, docs, tests, performance, or developer experience
  should change. Record the conclusion in the sample README.
- **Docs are for busy readers**: Public docs should help users act quickly.
  Remove planning notes, historical status, and internal commentary unless they
  directly improve user decisions.
- **Quality reports must be readable**: Coverage, performance, and cognitive
  complexity comments should be stable, precise enough to compare, and not noisy
  with excessive decimal places or missing base values.
- **Release confidence requires real consumption**: Keep package validation,
  packed consumer smoke tests, sample version sync, real driver integration, and
  supply-chain audit in the release path.
- **No broad public API until justified**: Especially for Drizzle-Zod/OpenAPI,
  start with clear app-owned patterns. Add package helpers only after a focused
  sample proves the helper improves maintainability without expanding the
  dependency surface carelessly.
- **Zod remains optional**: Do not let samples or docs imply that Zod is the
  library's default validation personality. The Nest-native default is DTO
  classes, `ValidationPipe`, and `@nestjs/swagger`; `drizzle-zod` is a useful
  opt-in companion when applications want schema-derived validation.
- **Dependency posture for validation**: `class-validator`, `@nestjs/swagger`,
  `zod`, and `drizzle-zod` must remain optional from the published package's
  perspective. Samples may install them to demonstrate app choices, but the
  library must not make one validation ecosystem mandatory.
- **Driver samples stay app-owned**: Driver-specific samples should construct
  the underlying driver in application code, pass a ready Drizzle client into
  `DrizzleModule`, and make shutdown behavior explicit. Prefer CI-friendly local
  database files for focused samples; use service-backed drivers only when that
  driver setup is the sample's core point. Service-backed samples should skip
  locally when their connection URL is missing, while CI should provide the
  service and run the real round trip.
- **Focused sample automation**: `npm run sample:focused` discovers focused
  samples from `sample/*/package.json`. New focused sample PRs should not need
  to edit the root script manually; keep explicit workspace commands only in
  human-facing docs for targeted debugging.
