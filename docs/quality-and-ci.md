# Quality And CI

The project reports package quality in three places:

- GitHub step summaries for quick CI scanning.
- Sticky pull request comments for coverage, test performance, and cognitive complexity.
- Uploaded artifacts for raw coverage, test, and complexity data.

## Coverage

Coverage uses `c8` over the package source:

```bash
npm run test:cov
```

The gate currently requires 100% statements, branches, functions, and lines.
The PR coverage comment compares the pull request against cached base-branch
coverage when base data is available.

CI runs package coverage on Node.js 22 and Node.js 24. The Node.js 22 quality
job owns PR coverage, performance, and cognitive complexity comments so those
reports stay single-source and easy to read.

## Performance

Tests use `node:test`. `npm run test:cov` runs a small reporting wrapper that
writes `test-results.json` with suite and individual test durations parsed from
the test runner output.

The PR performance comment shows:

- passed, failed, and skipped counts
- suite count
- total test step duration
- test execution duration
- slowest suites
- slowest individual tests

When base data exists, each duration includes a diff against the base branch.

These numbers are lightweight regression signals, not a synthetic benchmark.
Use them to notice suspicious changes, then inspect the related test, driver, or
sample before refactoring. A slower run can be caused by service-container
startup, dependency installation, or runner noise.

CI records two stable timing surfaces:

| Signal | Where it appears | What it means |
| --- | --- | --- |
| Package test step duration | PR performance comment and package quality summary | End-to-end package coverage step, including real driver tests |
| Test execution duration | PR performance comment | Time reported by `node:test` for package tests |
| Slowest suites/tests | PR performance comment | Review hints for package tests that changed or became unexpectedly slow |
| Sample validation duration | `Sample validation` job summary | Coarse duration for showcase plus focused samples, including service-backed samples in CI |

Keep precision readable. Reports round milliseconds and use two decimal places
for second-scale values so small runner fluctuations do not look more exact than
they are.

## Cognitive Complexity

Cognitive complexity uses SonarJS through ESLint:

```bash
npm run complexity:check
npm run complexity:report
```

`complexity:check` enforces the default threshold of `15` per source function.
`complexity:report` writes `complexity/cognitive-complexity-summary.json` with
totals, per-file aggregates, and the most complex functions.

The PR comment treats complexity as a review signal. The hard gate remains the
ESLint threshold.

## Driver Integration

Package tests exercise real Drizzle clients for libSQL, better-sqlite3,
PostgreSQL, and MySQL. GitHub Actions provides PostgreSQL and MySQL service
containers for the coverage job. Local runs skip those networked drivers unless
`NEST_DRIZZLE_NATIVE_POSTGRES_URL` and `NEST_DRIZZLE_NATIVE_MYSQL_URL` are set.

| Driver | Package test | Focused sample | Local behavior | CI behavior | Required env/service |
| --- | --- | --- | --- | --- | --- |
| libSQL | `driver-integration.spec.ts` | Most local samples use `@libsql/client` | Always runs with local file databases | Always runs with local file databases | None |
| better-sqlite3 | `driver-integration.spec.ts` | [`14-better-sqlite3-driver`](https://github.com/nest-native/drizzle/tree/main/sample/14-better-sqlite3-driver) | Always runs with a local SQLite file | Always runs with a local SQLite file | None |
| PostgreSQL / `pg` | `driver-integration.spec.ts` | [`15-postgres-driver`](https://github.com/nest-native/drizzle/tree/main/sample/15-postgres-driver) | Skips unless `NEST_DRIZZLE_NATIVE_POSTGRES_URL` is set | Runs against a PostgreSQL 16 service container | `NEST_DRIZZLE_NATIVE_POSTGRES_URL` or CI `postgres` service |
| MySQL / `mysql2` | `driver-integration.spec.ts` | [`16-mysql-driver`](https://github.com/nest-native/drizzle/tree/main/sample/16-mysql-driver) | Skips unless `NEST_DRIZZLE_NATIVE_MYSQL_URL` is set | Runs against a MySQL 8.4 service container | `NEST_DRIZZLE_NATIVE_MYSQL_URL` or CI `mysql` service |

The package coverage jobs and the `Sample validation` job both receive
workflow-generated PostgreSQL and MySQL URLs. Those URLs are test-only and must
not be copied into docs, samples, or logs beyond generic matrix summaries.

## Peer-Major Compatibility Legs

The lockfile keeps each peer's devDependency in the middle of its supported
range, so the main jobs test that. Extra jobs cover the ends:

| Job | What it installs | Blocking |
| --- | --- | --- |
| `NestJS 11 floor compatibility (Node 22)` | framework `11.0.1` and `@nestjs/swagger@11.4.7`, pinned exactly, on top of the 11.x lockfile in every workspace with `--no-save`. 11.0.1 because every swagger 11.x peers on common/core `^11.0.1` (this package itself uses nothing added after 11.0.0); 11.4.7 is the low end of the package's own optional swagger peer range. Then the same proof, package suite with the driver services, build, and sample matrix as the 12 leg | Yes |
| `NestJS 12 compatibility (Node 22)` | `@nestjs/*` and `@nestjs/swagger` at `^12` on top of the 11.x lockfile, in every workspace, with `--no-save`; then the proof, the package suite with the driver services, the build, and the sample matrix | Yes |
| `drizzle-orm v1 RC compatibility` | `drizzle-orm@rc` on top of the stable lockfile | No (informational) |

The two NestJS legs are one `nestjs-compat` matrix job. Before either runs
anything, `scripts/check-nestjs-resolution.mjs` proves the tree is the one the
leg claims: exactly the pinned version from inside every workspace (a
downgrade that silently no-ops would leave the lockfile's 11.x in place and
still "be 11"), no nested copies, and every peer range in the NestJS ecosystem
satisfied by the tree the suite will run on. That final-tree check is the gate
because npm's own signal is not one: a peer conflict npm can override is a
warning plus exit 0 that neither `npm ls` nor `--strict-peer-deps` reports, and
the same warning appears for transitional states that end coherent. The
`nestjs-cls` line (6.3.0 and up peers `>= 10 < 13`) serves both ends unchanged.
The same script runs against the lockfile in `release:check`.

To reproduce a leg locally, run the job's `npm install --no-save ...` and
`node scripts/check-nestjs-resolution.mjs ...` lines from
`.github/workflows/ci.yml`, then `npm test` and `npm run ci:sample`;
`npm ci` restores the lockfile state afterwards.

## Release And Security

Release validation checks README/docs links, the package tarball, and a
temporary consumer app that installs the packed tarball:

```bash
npm run release:check
```

For the publish checklist, version sync rules, and post-publish verification,
see [Release Guide](release.md).

After publishing, verify the registry package with:

```bash
npm run release:check:published -- <version>
```

That command installs the published package in a clean consumer and in a
temporary sample workspace so the checks cannot accidentally pass through a
local workspace link.

Supply-chain auditing checks high-severity production risk:

```bash
npm run security:audit
```

Run the complete local gate with:

```bash
npm run ci
```
