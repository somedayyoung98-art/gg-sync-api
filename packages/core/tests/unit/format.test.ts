import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runFormatStage } from '../../src/pipeline/stages/format';
import type { PipelineContext } from '../../src/pipeline/types';

function context(
  cwd: string,
  format: 'auto' | 'prettier' | false = 'auto',
): PipelineContext {
  return {
    cwd,
    config: {
      namespace: 'main',
      input: { kind: 'file', path: './openapi.json' },
      output: {
        dir: './generated',
        models: 'split',
        format,
        keepSpec: false,
      },
      generators: ['typescript'],
      compliance: { strict: false },
    },
    contract: {
      raw: '{}',
      parsed: {} as PipelineContext['contract']['parsed'],
      hash: 'hash',
    },
    baseline: { kind: 'missing' },
    diff: {
      hasBreaking: false,
      breaking: [],
      nonBreaking: [],
      summary: 'unchanged',
    },
    outputDir: path.join(cwd, 'generated'),
  };
}

async function installFakePrettier(cwd: string): Promise<void> {
  await fs.writeFile(
    path.join(cwd, 'package.json'),
    JSON.stringify({ private: true, devDependencies: { prettier: '^3.0.0' } }),
    'utf8',
  );
  const packageDir = path.join(cwd, 'node_modules/prettier');
  await fs.mkdir(packageDir, { recursive: true });
  await fs.writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify({ name: 'prettier', version: '3.0.0', main: './index.cjs' }),
    'utf8',
  );
  await fs.writeFile(
    path.join(packageDir, 'index.cjs'),
    `module.exports = {
  resolveConfig: async () => ({ semi: true }),
  getFileInfo: async (filePath) => ({
    ignored: filePath.endsWith('ignored.ts') || filePath.includes('logical-ignore'),
  }),
  format: async (source) => source.replace('const value=1', 'const value = 1'),
};
`,
    'utf8',
  );
}

describe('format stage', () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('formats generated TypeScript with the consumer project Prettier', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-format-'));
    await installFakePrettier(tmp);
    await fs.mkdir(path.join(tmp, 'generated/models'), { recursive: true });
    const sourcePath = path.join(tmp, 'generated/models/item.ts');
    const ignoredPath = path.join(tmp, 'generated/models/ignored.ts');
    await fs.writeFile(sourcePath, 'export const value=1;\n', 'utf8');
    await fs.writeFile(ignoredPath, 'export const value=1;\n', 'utf8');

    await runFormatStage(context(tmp));

    await expect(fs.readFile(sourcePath, 'utf8')).resolves.toContain('value = 1');
    await expect(fs.readFile(ignoredPath, 'utf8')).resolves.toContain('value=1');
  });

  it('falls back to the bundled Prettier', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-format-'));
    await fs.mkdir(path.join(tmp, 'generated'), { recursive: true });
    const sourcePath = path.join(tmp, 'generated/sdk.ts');
    await fs.writeFile(sourcePath, 'export const value=1\n', 'utf8');

    await runFormatStage(context(tmp));

    await expect(fs.readFile(sourcePath, 'utf8')).resolves.toBe(
      'export const value = 1;\n',
    );
  });

  it('does nothing when formatting is disabled', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-format-'));
    await installFakePrettier(tmp);
    await fs.mkdir(path.join(tmp, 'generated'), { recursive: true });
    const sourcePath = path.join(tmp, 'generated/sdk.ts');
    await fs.writeFile(sourcePath, 'export const value=1;\n', 'utf8');

    await runFormatStage(context(tmp, false));

    await expect(fs.readFile(sourcePath, 'utf8')).resolves.toContain('value=1');
  });
});
