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

## Release And Security

Release validation checks README/docs links, sample version sync, workspace
resolution, and the package tarball:

```bash
npm run release:check
```

Supply-chain auditing checks high-severity production risk:

```bash
npm run security:audit
```

Run the complete local gate with:

```bash
npm run ci
```

## Samples

Samples are release blockers. GitHub Actions runs them in the dedicated
`Sample validation` job, and the local gate includes the same matrix:

```bash
npm run ci:sample
```

`release:check` also verifies every `sample/*/package.json` depends on the
current `packages/drizzle` version and that npm workspace resolution agrees with
the lockfile.
