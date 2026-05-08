#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const sampleRoot = path.join(repoRoot, 'sample');
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const focusedSamples = collectFocusedSamples();

if (focusedSamples.length === 0) {
  console.log('No focused samples found.');
  process.exit(0);
}

for (const sample of focusedSamples) {
  console.log(`\nRunning ${sample.folder} (${sample.workspace})`);

  const result = spawnSync(
    npmExecutable,
    ['run', 'test', '--workspace', sample.workspace],
    {
      cwd: repoRoot,
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function collectFocusedSamples() {
  if (!fs.existsSync(sampleRoot)) {
    return [];
  }

  return fs
    .readdirSync(sampleRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .filter(entry => entry.name !== '00-showcase')
    .map(entry => readSample(entry.name))
    .filter(Boolean)
    .sort((left, right) => left.folder.localeCompare(right.folder));
}

function readSample(folder) {
  const packagePath = path.join(sampleRoot, folder, 'package.json');

  if (!fs.existsSync(packagePath)) {
    return undefined;
  }

  const samplePackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  if (!samplePackage.name) {
    throw new Error(`${packagePath} is missing a package name.`);
  }

  return {
    folder,
    workspace: samplePackage.name,
  };
}
