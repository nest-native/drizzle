#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const packageName = '@nest-native/drizzle';
const packageJson = readJson('packages/drizzle/package.json');
const packageVersion = packageJson.version;
const packageLock = readJson('package-lock.json');
const samplePackagePaths = collectSamplePackagePaths();
const failures = [];

for (const packagePath of samplePackagePaths) {
  const samplePackage = readJson(packagePath);
  const declaredVersion = samplePackage.dependencies?.[packageName];
  const lockPackagePath = path.dirname(packagePath);
  const lockEntry = packageLock.packages?.[lockPackagePath];
  const lockVersion = lockEntry?.dependencies?.[packageName];

  if (declaredVersion !== packageVersion) {
    failures.push(
      `${packagePath} declares ${packageName}@${declaredVersion ?? '<missing>'}; expected ${packageVersion}`,
    );
  }

  if (lockVersion !== packageVersion) {
    failures.push(
      `package-lock.json entry for ${lockPackagePath} resolves ${packageName}@${lockVersion ?? '<missing>'}; expected ${packageVersion}`,
    );
  }
}

const workspaceResolution = readWorkspaceResolution();
for (const packagePath of samplePackagePaths) {
  const samplePackage = readJson(packagePath);
  const sampleResolution = workspaceResolution.dependencies?.[samplePackage.name];
  const resolvedVersion = sampleResolution?.dependencies?.[packageName]?.version;

  if (resolvedVersion !== packageVersion) {
    failures.push(
      `workspace ${samplePackage.name} resolves ${packageName}@${resolvedVersion ?? '<missing>'}; expected ${packageVersion}`,
    );
  }
}

if (failures.length > 0) {
  throw new Error(`Sample version sync failed:\n${failures.join('\n')}`);
}

console.log(
  `Sample version sync OK: ${samplePackagePaths.length} samples use ${packageName}@${packageVersion}.`,
);

function collectSamplePackagePaths() {
  const sampleRoot = path.join(repoRoot, 'sample');
  if (!fs.existsSync(sampleRoot)) {
    return [];
  }

  return fs
    .readdirSync(sampleRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join('sample', entry.name, 'package.json'))
    .filter(packagePath => fs.existsSync(path.join(repoRoot, packagePath)))
    .sort();
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readWorkspaceResolution() {
  const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const output = execFileSync(
    npmExecutable,
    ['ls', packageName, '--workspaces', '--depth=0', '--json'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  return JSON.parse(output);
}
