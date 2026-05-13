# Release Guide

Use this checklist when publishing `nest-drizzle-native`. A release is worth
doing when the package metadata, README, public API, docs shipped in the npm
tarball, or runtime behavior has changed in a way users benefit from.

Sample-only changes can usually wait for the next package release unless they
also fix package documentation, release metadata, or published files.

## Before Bumping

Confirm the package is ready:

```bash
npm run ci
npm run security:audit
```

Review the diff for:

- `CHANGELOG.md` entries that describe user-facing changes
- public API changes
- dependency and lockfile churn
- install or lifecycle scripts
- docs examples that expose secrets or unsafe connection strings
- sample changes that reveal a package bug

The published package must keep `"dependencies": {}` empty. Runtime
integrations belong in `peerDependencies`; package-local tooling belongs in
`devDependencies`.

## Version Sync

When bumping `packages/drizzle/package.json`, update every sample dependency on
`nest-drizzle-native` to the exact same version:

```bash
npm install
npm run release:check:sample-versions
```

`npm install` refreshes the workspace lockfile so samples resolve the same
version that will be packed.

Move relevant `CHANGELOG.md` entries from `Unreleased` into the new version
section before opening the release PR.

## Release Checks

Run the release gate before publishing:

```bash
npm run release:check
npm ls nest-drizzle-native --workspaces --depth=0
npm run ci
```

`release:check` validates README/docs links, sample version sync, workspace
resolution, the package tarball, and a temporary consumer app that installs the
packed tarball.

## Publish

Publish from a clean, reviewed, merged `main` branch:

```bash
git status --short --branch
npm publish --workspace nest-drizzle-native --access public
```

Do not publish from a feature branch or with uncommitted files.

## Tag

After the registry version is confirmed, tag the exact release commit:

```bash
git tag nest-drizzle-native@<version>
git push origin nest-drizzle-native@<version>
```

## Post-Publish Verification

Verify the registry artifact, clean consumer path, and samples against the
published package:

```bash
npm run release:check:published -- <version>
```

The post-publish check fails if npm does not expose the version as `latest`, if
the published tarball is missing package entrypoints, if a clean consumer cannot
compile a Nest testing module with the package, or if samples accidentally
resolve a local workspace link instead of the registry package.
