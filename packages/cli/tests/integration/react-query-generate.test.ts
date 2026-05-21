import '@gg-sync/generator-orval';
import '@gg-sync/plugin-react-query';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const fixturesRoot = path.resolve(
  import.meta.dirname,
  '../../../core/tests/fixtures/diff-matrix',
);

describe('react-query generator', () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('generates hooks.ts when react-query is enabled and peer is present', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-rq-'));

    await fs.writeFile(
      path.join(tmp, 'package.json'),
      JSON.stringify(
        {
          name: 'rq-test',
          private: true,
          type: 'module',
          dependencies: {
            '@tanstack/react-query': '^5.0.0',
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    await fs.mkdir(path.join(tmp, 'src/api/runtime'), { recursive: true });
    await fs.writeFile(
      path.join(tmp, 'src/api/runtime/client.ts'),
      `export { createApiClient, customFetch } from '@gg-sync/runtime';\n`,
      'utf8',
    );

    await fs.copyFile(
      path.join(fixturesRoot, 'baseline.json'),
      path.join(tmp, 'openapi.json'),
    );

    const config = `export default {
  services: {
    main: {
      input: { path: './openapi.json' },
      output: { dir: './src/api/generated' },
      generators: ['typescript', 'sdk', 'react-query'],
    },
  },
};
`;
    await fs.writeFile(path.join(tmp, 'api-sync.config.ts'), config, 'utf8');

    execSync('npm install --no-package-lock --ignore-scripts', {
      cwd: tmp,
      stdio: 'pipe',
      timeout: 120_000,
    });

    const { runCommand } = await import('../../src/commands/run.js');
    const code = await runCommand({ cwd: tmp });
    expect(code).toBe(0);

    const hooksPath = path.join(tmp, 'src/api/generated/hooks.ts');
    await expect(fs.stat(hooksPath)).resolves.toBeDefined();
    const hooks = await fs.readFile(hooksPath, 'utf8');
    expect(hooks.length).toBeGreaterThan(0);
  }, 60_000);
});
