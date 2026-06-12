# Security Policy

Thank you for helping keep `@nest-native/drizzle` safe for NestJS and Drizzle
applications.

## Supported Versions

Security fixes target the current published package line.

| Package | Supported |
| --- | --- |
| `@nest-native/drizzle` latest minor | Yes |
| Older unpublished branches | No |

## Reporting A Vulnerability

Please do not open a public issue for vulnerabilities or suspected secret
leakage.

Use GitHub's private vulnerability reporting for this repository when available:

<https://github.com/nest-native/drizzle/security/advisories/new>

If private reporting is unavailable, contact the maintainer through the GitHub
profile and include only the minimum information needed to establish a private
channel. Do not send exploit details, credentials, tokens, database URLs, or
customer data in public comments.

## What To Include

Private reports are most useful when they include:

- Affected package version or commit.
- NestJS, Drizzle ORM, and database driver versions.
- The smallest reproduction or vulnerable code path.
- Expected impact, such as SQL injection, transaction context leakage, unsafe
  secret exposure, dependency confusion, or incorrect exception behavior.
- Whether the issue affects package code, samples, docs, CI, or release
  automation.

Please redact secrets, hostnames, tokens, connection strings, and private schema
or customer data.

## Project Security Boundaries

This package is a Nest integration layer around Drizzle. Applications still own:

- Database credentials and driver configuration.
- Pool sizing, TLS, network access, and deployment policy.
- Drizzle schema definitions and migrations.
- Authorization and tenant selection.
- Validation choices such as class-validator or app-owned Drizzle-Zod schemas.

Security fixes in this repository focus on package behavior, samples, docs,
release automation, and patterns that could encourage unsafe usage.

## Disclosure

The maintainer will acknowledge valid private reports as soon as practical,
coordinate a fix when the issue is in scope, and publish release notes or an
advisory when public disclosure is appropriate.
