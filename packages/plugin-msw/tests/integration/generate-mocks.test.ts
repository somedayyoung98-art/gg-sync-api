import '@gg-sync/generator-orval';
import '@gg-sync/plugin-msw';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runPipeline, loadConfig, resolveAllServices } from '@gg-sync/core';

const fixturesRoot = path.resolve(
  import.meta.dirname,
  '../../../core/tests/fixtures/diff-matrix',
);

describe('msw mock generation', () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('generates mocks.ts when msw generator is enabled', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-msw-'));

    await fs.writeFile(
      path.join(tmp, 'package.json'),
      JSON.stringify(
        {
          name: 'msw-test',
          private: true,
          type: 'module',
          dependencies: {
            msw: '^2.0.0',
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    execSync('npm install --no-package-lock --ignore-scripts', {
      cwd: tmp,
      stdio: 'pipe',
      timeout: 120_000,
    });

    await fs.copyFile(
      path.join(fixturesRoot, 'baseline.json'),
      path.join(tmp, 'openapi.json'),
    );

    const config = `export default {
  services: {
    main: {
      input: { path: './openapi.json' },
      output: { dir: './src/api/generated' },
      generators: ['typescript', 'sdk', 'msw'],
      runtime: { baseURL: 'http://localhost:3000' },
    },
  },
};
`;
    await fs.writeFile(path.join(tmp, 'api-sync.config.ts'), config, 'utf8');

    const loaded = await loadConfig({
      cwd: tmp,
      configPath: path.join(tmp, 'api-sync.config.ts'),
    });
    const services = resolveAllServices(loaded);
    const result = await runPipeline({ cwd: tmp, services });
    expect(result.exitCode).toBe(0);

    const outDir = path.join(tmp, 'src/api/generated');
    const entries = await fs.readdir(outDir);
    const mockFile = entries.find(
      (name) => name.endsWith('.msw.ts') || name === 'mocks.ts',
    );
    expect(
      mockFile,
      `expected *.msw.ts or mocks.ts in ${entries.join(', ')}`,
    ).toBeDefined();

    const mockSource = await fs.readFile(path.join(outDir, mockFile!), 'utf8');
    expect(mockSource.length).toBeGreaterThan(0);
    expect(mockSource).toMatch(/msw|http\.|handler/i);
  }, 60_000);
});
