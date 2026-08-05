import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '../..');
const npmCli = path.join(
  path.dirname(process.execPath),
  'node_modules/npm/bin/npm-cli.js',
);
const packageDirs = [
  'packages/api-sync',
  'packages/cli',
  'packages/core',
  'packages/generator-orval',
  'packages/runtime',
];

async function run(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

function runNpm(args: string[], cwd: string) {
  return process.platform === 'win32'
    ? run(process.execPath, [npmCli, ...args], cwd)
    : run('npm', args, cwd);
}

describe('packed npm consumer', () => {
  let root = '';
  let tarballs: string[] = [];

  beforeAll(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-release-'));
    const packDir = path.join(root, 'packs');
    await fs.mkdir(packDir);

    for (const packageDir of packageDirs) {
      const { stdout } = await runNpm(
        ['pack', '--json', '--ignore-scripts', '--pack-destination', packDir],
        path.join(repoRoot, packageDir),
      );
      const [{ filename }] = JSON.parse(stdout) as Array<{ filename: string }>;
      tarballs.push(path.join(packDir, filename));
    }

    await fs.writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'api-sync-consumer', private: true, type: 'module' }),
      'utf8',
    );
    await runNpm(
      ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs],
      root,
    );
  });

  afterAll(async () => {
    if (root) await fs.rm(root, { recursive: true, force: true });
  });

  it('installs the umbrella package and runs its published binary', async () => {
    const bin = path.join(
      root,
      'node_modules/@somedayyoung/api-sync/bin/sync-api.js',
    );
    const { stdout } = await run(process.execPath, [bin, '--version'], root);

    expect(stdout).toMatch(/^sync-api\/3\.0\.0\b/);
  });

  it('loads a typed config, generates a custom type.ts, and compiles it', async () => {
    await fs.writeFile(
      path.join(root, 'openapi.json'),
      JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Packed consumer API', version: '1.0.0' },
        paths: {
          '/items/{id}': {
            get: {
              operationId: 'getItem',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              responses: {
                '200': {
                  description: 'Item',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Item' },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            Item: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      }),
      'utf8',
    );
    await fs.writeFile(
      path.join(root, 'api-sync.config.ts'),
      `import { defineConfig } from '@somedayyoung/api-sync';

export default defineConfig({
  services: {
    main: {
      input: { path: './openapi.json' },
      output: {
        dir: './src/api/generated',
        models: { file: 'type.ts' },
        format: 'auto',
      },
      generators: ['typescript', 'sdk'],
    },
  },
});
`,
      'utf8',
    );

    const bin = path.join(
      root,
      'node_modules/@somedayyoung/api-sync/bin/sync-api.js',
    );
    await run(process.execPath, [bin, 'run'], root);

    const typeSource = await fs.readFile(
      path.join(root, 'src/api/generated/type.ts'),
      'utf8',
    );
    await expect(
      fs.stat(path.join(root, 'src/api/generated/sdk.ts')),
    ).resolves.toBeDefined();
    await expect(
      fs.stat(path.join(root, '.api-sync-cache/main/latest-schema.json')),
    ).resolves.toBeDefined();
    expect(typeSource).toContain('export type Item');

    await fs.writeFile(
      path.join(root, 'consumer.ts'),
      `import { API_SYNC_VERSION } from '@somedayyoung/api-sync';
import type { Item } from './src/api/generated/type';

const item: Item = { id: '1', name: API_SYNC_VERSION };
void item;
`,
      'utf8',
    );
    await fs.writeFile(
      path.join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          lib: ['ES2022', 'DOM'],
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ['api-sync.config.ts', 'consumer.ts', 'src/**/*.ts'],
      }),
      'utf8',
    );

    await run(
      process.execPath,
      [path.join(repoRoot, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'],
      root,
    );
  });

  it('prints the missing config field path', async () => {
    await fs.writeFile(
      path.join(root, 'invalid.config.ts'),
      `export default { services: { main: { input: { path: './openapi.json' } } } };`,
      'utf8',
    );
    const bin = path.join(
      root,
      'node_modules/@somedayyoung/api-sync/bin/sync-api.js',
    );

    await expect(
      run(process.execPath, [bin, 'run', '--config', './invalid.config.ts'], root),
    ).rejects.toMatchObject({
      stderr: expect.stringMatching(/services\.main\.output/),
    });
  });
});
