# CLAUDE.md

@GUIDELINES_NEST_DRIZZLE.md

The imported guidelines are binding. Two always-on rules:
- Full-mode infra (`infra:up` + `test:full`) and Stryker mutation testing are local-only — never wire them into CI.
- Mutation testing is an **occasional, targeted audit — not a per-PR gate**. Run it deliberately when you've reworked a file's logic: scope with `STRYKER_MUTATE` to that one file, `--concurrency 2`, and verify a kill by hand-applying the mutation + running the plain suite (see the guidelines' Mutation testing section).
