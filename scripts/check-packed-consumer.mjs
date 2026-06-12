import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeExecutable = process.execPath;
const repoRoot = process.cwd();
const tempRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'nest-native-drizzle-consumer-'),
);
const consumerRoot = path.join(tempRoot, 'consumer');
const npmCache = path.join(tempRoot, 'npm-cache');

try {
  fs.mkdirSync(consumerRoot);

  const tarballPath = packTarball();
  writeConsumerPackage(tarballPath);
  writeConsumerSmoke();

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
      env: {
        ...process.env,
        npm_config_cache: npmCache,
      },
    },
  );
  execFileSync(nodeExecutable, ['smoke.cjs'], {
    cwd: consumerRoot,
    stdio: 'inherit',
  });

  console.log('Packed consumer validation OK.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function packTarball() {
  const rawOutput = execFileSync(
    npmExecutable,
    [
      'pack',
      '--json',
      '--workspace',
      '@nest-native/drizzle',
      '--pack-destination',
      tempRoot,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_cache: npmCache,
      },
    },
  );
  const [packResult] = JSON.parse(rawOutput);

  if (!packResult?.filename) {
    throw new Error('npm pack did not produce a tarball filename.');
  }

  return path.join(tempRoot, packResult.filename);
}

function writeConsumerPackage(tarballPath) {
  const rootPackage = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  );
  const devDependencies = rootPackage.devDependencies ?? {};
  const dependencies = {
    '@nestjs/common': devDependencies['@nestjs/common'],
    '@nestjs/core': devDependencies['@nestjs/core'],
    '@nestjs/testing': devDependencies['@nestjs/testing'],
    'drizzle-orm': devDependencies['drizzle-orm'],
    '@nest-native/drizzle': `file:${tarballPath}`,
    'reflect-metadata': devDependencies['reflect-metadata'],
    rxjs: devDependencies.rxjs,
  };
  const missingDependencies = Object.entries(dependencies)
    .filter(([, version]) => !version)
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
        name: 'nest-native-drizzle-packed-consumer',
        private: true,
        type: 'commonjs',
        dependencies,
      },
      null,
      2,
    )}\n`,
  );
}

function writeConsumerSmoke() {
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
} = require('@nest-native/drizzle');
const packageJson = require('@nest-native/drizzle/package.json');

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
  assert.equal(
    Object.keys(packageJson.dependencies ?? {}).length,
    0,
    'The packed package must not declare runtime dependencies.',
  );

  await moduleRef.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
`,
  );
}
