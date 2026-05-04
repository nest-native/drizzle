#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const ROOT = process.cwd();
const require = createRequire(import.meta.url);
const OUTPUT_PATH = path.join(
  ROOT,
  'complexity',
  'cognitive-complexity-summary.json',
);
const ESLINT_BIN = path.join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'eslint.cmd' : 'eslint',
);

const eslintOutput = execFileSync(
  ESLINT_BIN,
  [
    '--config',
    'eslint.complexity.config.mjs',
    '--format',
    'json',
    'packages/drizzle/**/*.ts',
  ],
  {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  },
);

const entries = JSON.parse(eslintOutput)
  .flatMap(result => {
    const file = path.relative(ROOT, result.filePath).replace(/\\/g, '/');
    return result.messages
      .filter(message => message.ruleId === 'sonarjs/cognitive-complexity')
      .map(message => ({
        file,
        line: message.line,
        column: message.column,
        complexity: extractComplexity(message.message),
        message: message.message,
      }));
  })
  .filter(entry => entry.complexity > 0)
  .sort((a, b) => b.complexity - a.complexity || a.file.localeCompare(b.file));

const summary = {
  generatedAt: new Date().toISOString(),
  tool: {
    eslint: readPackageVersion('eslint'),
    eslintPluginSonarjs: readPackageVersion('eslint-plugin-sonarjs'),
    typescriptEslintParser: readPackageVersion('@typescript-eslint/parser'),
  },
  scope: {
    include: ['packages/drizzle/**/*.ts'],
    exclude: ['packages/drizzle/test/**', '**/dist/**', '**/*.d.ts', '**/*.js'],
  },
  totals: {
    functions: entries.length,
    totalComplexity: entries.reduce((total, entry) => total + entry.complexity, 0),
    maxComplexity: entries[0]?.complexity ?? 0,
  },
  entries,
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`);

console.log(`Cognitive complexity report written to ${path.relative(ROOT, OUTPUT_PATH)}`);

function extractComplexity(message) {
  const match = message.match(/Cognitive Complexity from (\d+) to/i);
  return match ? Number(match[1]) : 0;
}

function readPackageVersion(packageName) {
  const packageJson = fs.readFileSync(
    require.resolve(`${packageName}/package.json`),
    'utf8',
  );
  return JSON.parse(packageJson).version;
}
