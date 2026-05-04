import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const repoRoot = process.cwd();
const tempCache = fs.mkdtempSync(path.join(os.tmpdir(), 'nest-drizzle-native-pack-'));

try {
  const rawOutput = execFileSync(
    npmExecutable,
    ['pack', '--dry-run', '--json', '--workspace', 'nest-drizzle-native'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_cache: tempCache,
      },
    },
  );

  const [packResult] = JSON.parse(rawOutput);
  if (!packResult || !Array.isArray(packResult.files)) {
    throw new Error('npm pack --dry-run did not return the expected JSON payload.');
  }

  const filePaths = packResult.files.map(file => file.path);
  const requiredFiles = [
    'README.md',
    'package.json',
    'dist/index.js',
    'dist/index.d.ts',
  ];
  const missingFiles = requiredFiles.filter(filePath => !filePaths.includes(filePath));

  if (missingFiles.length > 0) {
    throw new Error(`Packed tarball is missing required files: ${missingFiles.join(', ')}`);
  }

  const unexpectedFiles = filePaths.filter(filePath => {
    if (filePath === 'LICENSE' || filePath === 'README.md' || filePath === 'package.json') {
      return false;
    }

    return !/^dist\/.+\.(d\.ts|js|js\.map)$/.test(filePath);
  });

  if (unexpectedFiles.length > 0) {
    throw new Error(
      `Packed tarball contains unexpected files:\n${unexpectedFiles
        .map(filePath => `- ${filePath}`)
        .join('\n')}`,
    );
  }

  console.log(
    `Pack validation OK: ${packResult.filename} contains ${packResult.entryCount} expected files.`,
  );
} finally {
  fs.rmSync(tempCache, { recursive: true, force: true });
}
