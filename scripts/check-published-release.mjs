#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeExecutable = process.execPath;
const repoRoot = process.cwd();
const packagePath = path.join(repoRoot, 'packages/drizzle/package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const packageName = packageJson.name;
const version = process.argv[2] ?? packageJson.version;
const tempRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'nest-drizzle-native-published-release-'),
);
const npmCache = path.join(tempRoot, 'npm-cache');

try {
  verifyRegistryVersion();
  packPublishedArtifact();
  runPublishedConsumerSmoke();
  runPublishedSampleSmoke();

  console.log(`Published release validation OK for ${packageName}@${version}.`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function verifyRegistryVersion() {
  const rawOutput = execFileSync(
    npmExecutable,
    ['view', `${packageName}@${version}`, 'version', 'dist-tags.latest', 'dist.tarball', '--json'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: npmEnv(),
    },
  );
  const registryInfo = JSON.parse(rawOutput);

  if (registryInfo.version !== version) {
    throw new Error(
      `Expected npm version ${version}, but registry returned ${registryInfo.version}.`,
    );
  }

  if (registryInfo['dist-tags.latest'] !== version) {
    throw new Error(
      `Expected npm latest tag ${version}, but registry returned ${registryInfo['dist-tags.latest']}.`,
    );
  }

  if (!registryInfo['dist.tarball']) {
    throw new Error('Registry response is missing the published tarball URL.');
  }

  console.log(`Registry validation OK: ${packageName}@${version} is latest.`);
}

function packPublishedArtifact() {
  const rawOutput = execFileSync(
    npmExecutable,
    ['pack', `${packageName}@${version}`, '--json', '--pack-destination', tempRoot],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: npmEnv(),
    },
  );
  const [packResult] = JSON.parse(rawOutput);

  if (!packResult?.filename || !Array.isArray(packResult.files)) {
    throw new Error('npm pack did not return the expected published artifact payload.');
  }

  const filePaths = packResult.files.map(file => file.path);
  for (const requiredFile of ['README.md', 'package.json', 'dist/index.js', 'dist/index.d.ts']) {
    if (!filePaths.includes(requiredFile)) {
      throw new Error(`Published artifact is missing ${requiredFile}.`);
    }
  }

  console.log(
    `Published artifact validation OK: ${packResult.filename} contains ${packResult.entryCount} files.`,
  );
}

function runPublishedConsumerSmoke() {
  const consumerRoot = path.join(tempRoot, 'consumer');
  fs.mkdirSync(consumerRoot);
  writeConsumerPackage(consumerRoot);
  writeConsumerSmoke(consumerRoot);

  execFileSync(
    npmExecutable,
    [
      'install',
      '--package-lock=false',
      '--no-audit',
      '--fund=false',
      '--ignore-scripts',
    ],
    {
      cwd: consumerRoot,
      stdio: 'inherit',
      env: npmEnv(),
    },
  );
  execFileSync(nodeExecutable, ['smoke.cjs'], {
    cwd: consumerRoot,
    stdio: 'inherit',
  });

  console.log('Published consumer validation OK.');
}

function writeConsumerPackage(consumerRoot) {
  const rootPackage = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  );
  const devDependencies = rootPackage.devDependencies ?? {};
  const dependencies = {
    '@nestjs/common': devDependencies['@nestjs/common'],
    '@nestjs/core': devDependencies['@nestjs/core'],
    '@nestjs/testing': devDependencies['@nestjs/testing'],
    'drizzle-orm': devDependencies['drizzle-orm'],
    [packageName]: version,
    'reflect-metadata': devDependencies['reflect-metadata'],
    rxjs: devDependencies.rxjs,
  };
  const missingDependencies = Object.entries(dependencies)
    .filter(([, dependencyVersion]) => !dependencyVersion)
    .map(([name]) => name);

  if (missingDependencies.length > 0) {
    throw new Error(
      `Consumer smoke is missing dependency versions: ${missingDependencies.join(', ')}`,
    );
  }

  fs.writeFileSync(
    path.join(consumerRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'nest-drizzle-native-published-consumer',
        private: true,
        type: 'commonjs',
        dependencies,
      },
      null,
      2,
    )}\n`,
  );
}

function writeConsumerSmoke(consumerRoot) {
  fs.writeFileSync(
    path.join(consumerRoot, 'smoke.cjs'),
    `'use strict';

require('reflect-metadata');

const assert = require('node:assert/strict');
const { Injectable, Module } = require('@nestjs/common');
const { Test } = require('@nestjs/testing');
const {
  DrizzleModule,
  InjectDrizzle,
  getDrizzleClientToken,
} = require('${packageName}');
const packageJson = require('${packageName}/package.json');

const fakeClient = {
  query: {
    users: {
      findMany: () => ['Ada', 'Grace'],
    },
  },
};
const schema = {
  users: {
    tableName: 'users',
  },
};

class UsersService {
  constructor(db) {
    this.db = db;
  }

  findMany() {
    return this.db.query.users.findMany();
  }
}
InjectDrizzle()(UsersService, undefined, 0);
Injectable()(UsersService);

class AppModule {}
Module({
  imports: [
    DrizzleModule.forRoot({
      connection: fakeClient,
      isGlobal: false,
      schema,
    }),
  ],
  providers: [UsersService],
})(AppModule);

(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  assert.equal(moduleRef.get(getDrizzleClientToken()), fakeClient);
  assert.deepEqual(moduleRef.get(UsersService).findMany(), ['Ada', 'Grace']);
  assert.deepEqual(packageJson.dependencies, {});

  await moduleRef.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
`,
  );
}

function runPublishedSampleSmoke() {
  const sampleWorkspace = path.join(tempRoot, 'samples');
  fs.mkdirSync(sampleWorkspace);

  writeSampleWorkspacePackage(sampleWorkspace);
  fs.cpSync(path.join(repoRoot, 'sample'), path.join(sampleWorkspace, 'sample'), {
    recursive: true,
  });
  fs.cpSync(path.join(repoRoot, 'scripts'), path.join(sampleWorkspace, 'scripts'), {
    recursive: true,
    filter: source => !source.includes(`${path.sep}node_modules${path.sep}`),
  });
  fs.copyFileSync(
    path.join(repoRoot, 'tsconfig.base.json'),
    path.join(sampleWorkspace, 'tsconfig.base.json'),
  );

  execFileSync(npmExecutable, ['install', '--package-lock=false'], {
    cwd: sampleWorkspace,
    stdio: 'inherit',
    env: npmEnv(),
  });

  const resolutionOutput = execFileSync(
    npmExecutable,
    ['ls', packageName, '--workspaces', '--depth=0'],
    {
      cwd: sampleWorkspace,
      encoding: 'utf8',
      env: npmEnv(),
    },
  );

  const localPackageLinkPattern = new RegExp(
    `${escapeRegExp(packageName)}@[^\\s]+\\s+->`,
  );

  if (localPackageLinkPattern.test(resolutionOutput)) {
    throw new Error(
      `Sample workspace resolved ${packageName} through a local workspace link:\n${resolutionOutput}`,
    );
  }

  execFileSync(npmExecutable, ['run', 'ci:sample'], {
    cwd: sampleWorkspace,
    stdio: 'inherit',
    env: npmEnv(),
  });

  console.log('Published sample validation OK.');
}

function writeSampleWorkspacePackage(sampleWorkspace) {
  fs.writeFileSync(
    path.join(sampleWorkspace, 'package.json'),
    `${JSON.stringify(
      {
        name: 'nest-drizzle-native-published-samples',
        private: true,
        workspaces: ['sample/*'],
        scripts: {
          showcase:
            'node scripts/run-optional-workspace.cjs nest-drizzle-native-showcase test',
          'sample:focused': 'node scripts/run-focused-samples.mjs',
          sample: 'npm run showcase && npm run sample:focused',
          'ci:sample': 'npm run sample',
        },
      },
      null,
      2,
    )}\n`,
  );
}

function npmEnv() {
  return {
    ...process.env,
    npm_config_cache: npmCache,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
