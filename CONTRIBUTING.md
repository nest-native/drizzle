# Contributing

Thanks for helping improve `@nest-native/drizzle`.

## Sample Work Must Stay Separate From Library Fixes

Sample PRs are allowed to change sample code, docs, CI wiring, and release
checks that are directly needed for samples. They must not include changes under
`packages/drizzle/**`.

If a sample exposes a package bug, stop the sample PR and use this workflow:

1. Stash the sample and docs work, including untracked files:

   ```bash
   git stash push -u -m "sample work before library fix"
   ```

2. Create a separate library-fix branch from `main`.
3. Fix the package bug with focused regression tests.
4. Run the package validation commands for that fix.
5. Open and merge the library-fix PR first.
6. Return to the sample branch and re-apply the stash:

   ```bash
   git stash pop
   ```

7. Before committing the sample PR, verify the touched package files list is
   empty:

   ```bash
   git diff --name-only main...HEAD -- packages/drizzle
   git diff --cached --name-only -- packages/drizzle
   ```

If either command prints files, split those package changes into a dedicated
library-fix PR before continuing the sample PR.

## Sample PR Checklist

- The PR title or body names the sample issue it closes.
- The PR does not include `packages/drizzle/**` changes.
- The sample README explains which library feature is being demonstrated.
- The sample runs from a clean checkout with the documented command.
- The relevant local validation command is included in the PR body.

## Library-Fix PR Checklist

- The PR includes a regression test under `packages/drizzle/test`.
- The PR does not include sample implementation work.
- `npm run test:cov` passes.
- `npm run complexity:check` and `npm run complexity:report` pass when package
  source files are touched.
- The PR body includes a short security pass.
