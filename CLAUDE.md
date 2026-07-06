# CLAUDE.md

@GUIDELINES_NEST_DRIZZLE.md

The imported guidelines are binding. Two always-on rules:
- Full-mode infra (`infra:up` + `test:full`) and Stryker mutation testing are local-only — never wire them into CI.
- Pre-PR ritual: `npm run test:mutation` (scope with `STRYKER_MUTATE` to changed files) and report surviving mutants in the PR body.
