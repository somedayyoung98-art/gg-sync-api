import '@somedayyoung/generator-orval';
import { execFile } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getBaselineHashPath,
  getBaselineSchemaPath,
  loadConfig,
  resolveAllServices,
  runPipeline,
} from '@somedayyoung/core';
import { runCommand } from '../../packages/cli/src/commands/run';

const fixturePath = path.resolve(
  import.meta.dirname,
  '../../packages/core/tests/fixtures/diff-matrix/baseline.json',
);
const repoRoot = path.resolve(import.meta.dirname, '../..');
const execFileAsync = promisify(execFile);

async function writePackage(
  root: string,
  packageName: string,
  version: string,
  files: Record<string, string> = {},
): Promise<void> {
  const packageDir = path.join(root, 'node_modules', ...packageName.split('/'));
  await fs.mkdir(packageDir, { recursive: true });
  await fs.writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify({
      name: packageName,
      version,
      main: files['index.cjs'] ? './index.cjs' : undefined,
    }),
    'utf8',
  );
  await Promise.all(
    Object.entries(files).map(([file, source]) =>
      fs.writeFile(path.join(packageDir, file), source, 'utf8'),
    ),
  );
}

async function linkPackage(
  root: string,
  packageName: string,
  source: string,
): Promise<void> {
  const packagePath = path.join(root, 'node_modules', ...packageName.split('/'));
  await fs.mkdir(path.dirname(packagePath), { recursive: true });
  const target = await fs.realpath(path.join(repoRoot, source));
  await fs.symlink(target, packagePath, process.platform === 'win32' ? 'junction' : 'dir');
}

async function writeConsumerPackage(root: string): Promise<void> {
  await fs.writeFile(
    path.join(root, 'package.json'),
    JSON.stringify(
      {
        name: 'api-sync-full-config-regression',
        private: true,
        type: 'module',
        dependencies: {
          '@faker-js/faker': '^9.0.0',
          '@tanstack/react-query': '^5.0.0',
          msw: '^2.0.0',
          zod: '^3.24.0',
        },
        devDependencies: {
          prettier: '^3.0.0',
        },
      },
      null,
      2,
    ),
    'utf8',
  );

  await linkPackage(
    root,
    '@faker-js/faker',
    'packages/plugin-msw/node_modules/@faker-js/faker',
  );
  await linkPackage(
    root,
    '@tanstack/react-query',
    'packages/cli/node_modules/@tanstack/react-query',
  );
  await linkPackage(root, 'msw', 'packages/plugin-msw/node_modules/msw');
  await linkPackage(root, 'zod', 'packages/plugin-zod/node_modules/zod');
  await writePackage(root, 'prettier', '3.0.0', {
    'index.cjs': `const marker = '/* regression-formatted */\\n';
module.exports = {
  resolveConfig: async () => ({ semi: true }),
  getFileInfo: async () => ({ ignored: false }),
  format: async (source) => source.startsWith(marker) ? source : marker + source,
};
`,
  });
}

async function assertGeneratedProjectCompiles(root: string): Promise<void> {
  await fs.writeFile(
    path.join(root, 'generated-contract-usage.ts'),
    `import type { Item } from './generated/url/type';
import { getItem } from './generated/url/sdk';

const valid: Item = {
  id: 'item-1',
  name: 'A reliable item',
  tags: ['regression'],
};

// @ts-expect-error OpenAPI requires name.
const missingRequired: Item = { id: 'item-2' };

// @ts-expect-error OpenAPI defines tags as string[].
const wrongArrayElement: Item = { id: 'item-3', name: 'bad', tags: [1] };

void valid;
void missingRequired;
void wrongArrayElement;
void getItem('item-1');
`,
    'utf8',
  );
  await fs.writeFile(
    path.join(root, 'tsconfig.generated.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          lib: ['ES2022', 'DOM'],
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ['generated/**/*.ts', 'generated-contract-usage.ts'],
      },
      null,
      2,
    ),
    'utf8',
  );

  const tscPath = path.join(repoRoot, 'node_modules/typescript/bin/tsc');
  await execFileAsync(process.execPath, [tscPath, '-p', 'tsconfig.generated.json'], {
    cwd: root,
  });
}

async function startSpecServer(spec: string): Promise<{
  server: Server;
  url: string;
}> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(spec);
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Regression OpenAPI server did not bind to a TCP port');
  }
  return {
    server,
    url: `http://127.0.0.1:${address.port}/openapi.json`,
  };
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function findMockFile(outputDir: string): Promise<string | undefined> {
  const entries = await fs.readdir(outputDir);
  return entries.find((name) => name === 'mocks.ts' || name.endsWith('.msw.ts'));
}

describe('full config regression pipeline', () => {
  let tmp = '';
  let server: Server | undefined;

  afterEach(async () => {
    if (server) await closeServer(server);
    if (tmp && process.env.API_SYNC_KEEP_REGRESSION_TMP !== '1') {
      await fs.rm(tmp, { recursive: true, force: true });
    }
    server = undefined;
    tmp = '';
  });

  it('runs path and URL inputs with every generator and output option', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-regression-'));
    await writeConsumerPackage(tmp);

    const spec = await fs.readFile(fixturePath, 'utf8');
    await fs.writeFile(path.join(tmp, 'path-openapi.json'), spec, 'utf8');
    await fs.writeFile(path.join(tmp, 'raw-openapi.json'), spec, 'utf8');
    const specServer = await startSpecServer(spec);
    server = specServer.server;

    await fs.writeFile(
      path.join(tmp, 'all-options.config.ts'),
      `export default {
  compliance: { strict: false },
  runtime: {
    baseURL: 'https://global.example.test',
    timeout: 10000,
    validationRate: 0.25,
  },
  services: {
    pathService: {
      input: { path: './path-openapi.json' },
      output: {
        dir: './generated/path',
        models: 'split',
        format: 'auto',
        keepSpec: true,
      },
      compliance: { strict: true },
      runtime: { timeout: 2500 },
    },
    urlService: {
      input: { url: '${specServer.url}' },
      output: {
        dir: './generated/url',
        models: { file: 'type.ts' },
        format: 'prettier',
        keepSpec: false,
      },
      generators: ['typescript', 'sdk', 'react-query', 'msw', 'zod'],
      runtime: {
        baseURL: 'http://mock.example.test',
        validationRate: 1,
      },
    },
    noFormat: {
      input: { path: './raw-openapi.json' },
      output: {
        dir: './generated/raw',
        models: 'split',
        format: false,
        keepSpec: false,
      },
      generators: ['typescript'],
    },
  },
};
`,
      'utf8',
    );

    const configPath = path.join(tmp, 'all-options.config.ts');
    const loaded = await loadConfig({ cwd: tmp, configPath });
    const services = resolveAllServices(loaded);
    expect(services).toHaveLength(3);
    expect(services[0]).toMatchObject({
      generators: ['typescript', 'sdk'],
      compliance: { strict: true },
      runtime: {
        baseURL: 'https://global.example.test',
        timeout: 2500,
        validationRate: 0.25,
      },
    });
    expect(services[1]?.runtime).toEqual({
      baseURL: 'http://mock.example.test',
      timeout: 10000,
      validationRate: 1,
    });

    await expect(
      runCommand({ cwd: tmp, config: './all-options.config.ts' }),
    ).resolves.toBe(0);

    const pathOutput = path.join(tmp, 'generated/path');
    const urlOutput = path.join(tmp, 'generated/url');
    const rawOutput = path.join(tmp, 'generated/raw');

    await expect(fs.stat(path.join(pathOutput, 'sdk.ts'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(pathOutput, 'models/index.ts'))).resolves.toBeDefined();
    await expect(
      fs.stat(path.join(pathOutput, '.api-sync-openapi.json')),
    ).resolves.toBeDefined();
    await expect(fs.readFile(path.join(pathOutput, 'sdk.ts'), 'utf8')).resolves.toMatch(
      /^\/\* regression-formatted \*\//,
    );

    await expect(fs.stat(path.join(urlOutput, 'sdk.ts'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(urlOutput, 'hooks.ts'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(urlOutput, 'type.ts'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(urlOutput, 'type'))).rejects.toThrow();
    await expect(
      fs.stat(path.join(urlOutput, '.api-sync-openapi.json')),
    ).rejects.toThrow();
    const mockFile = await findMockFile(urlOutput);
    expect(mockFile).toBeDefined();
    const sdkSource = await fs.readFile(path.join(urlOutput, 'sdk.ts'), 'utf8');
    expect(sdkSource).toMatch(/^\/\* regression-formatted \*\//);
    expect(sdkSource).toContain('http://mock.example.test');
    const zodSource = await fs.readFile(path.join(urlOutput, 'zod.ts'), 'utf8');
    expect(zodSource).toMatch(/^\/\* regression-formatted \*\//);
    expect(zodSource).toMatch(/from ['"]zod['"]|z\.(?:object|string|number)/);
    await expect(
      fs.readFile(path.join(urlOutput, mockFile!), 'utf8'),
    ).resolves.toContain('http://mock.example.test');

    await expect(fs.stat(path.join(rawOutput, 'sdk.ts'))).rejects.toThrow();
    await expect(fs.stat(path.join(rawOutput, 'models/index.ts'))).resolves.toBeDefined();
    await expect(
      fs.readFile(path.join(rawOutput, 'models/index.ts'), 'utf8'),
    ).resolves.not.toMatch(/^\/\* regression-formatted \*\//);

    await expect(assertGeneratedProjectCompiles(tmp)).resolves.toBeUndefined();

    for (const namespace of ['pathService', 'urlService', 'noFormat']) {
      await expect(fs.stat(getBaselineSchemaPath(tmp, namespace))).resolves.toBeDefined();
      await expect(fs.stat(getBaselineHashPath(tmp, namespace))).resolves.toBeDefined();
    }

    const pathService = services[0]!;
    const singleModels = await runPipeline({
      cwd: tmp,
      services: [
        {
          ...pathService,
          output: { ...pathService.output, models: { file: 'type.ts' } },
        },
      ],
    });
    expect(singleModels.kind).toBe('success');
    await expect(fs.stat(path.join(pathOutput, 'type.ts'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(pathOutput, 'type'))).rejects.toThrow();

    const splitModels = await runPipeline({
      cwd: tmp,
      services: [
        {
          ...pathService,
          output: { ...pathService.output, models: 'split' },
        },
      ],
    });
    expect(splitModels.kind).toBe('success');
    await expect(fs.stat(path.join(pathOutput, 'type.ts'))).rejects.toThrow();
    await expect(fs.stat(path.join(pathOutput, 'models/index.ts'))).resolves.toBeDefined();

    const pathBaseline = await fs.readFile(
      getBaselineSchemaPath(tmp, 'pathService'),
      'utf8',
    );
    const unchanged = await runPipeline({
      cwd: tmp,
      services,
      namespaceFilter: 'pathService',
      mode: 'diff-only',
    });
    expect(unchanged.kind).toBe('success');
    expect(unchanged.outcomes[0]?.context.diff.summary).toMatch(/unchanged/i);
    await expect(
      fs.readFile(getBaselineSchemaPath(tmp, 'pathService'), 'utf8'),
    ).resolves.toBe(pathBaseline);

    const breaking = JSON.parse(spec) as {
      paths: Record<string, unknown>;
    };
    delete breaking.paths['/items/{id}'];
    await fs.writeFile(
      path.join(tmp, 'path-openapi.json'),
      JSON.stringify(breaking, null, 2),
      'utf8',
    );
    const strictDiff = await runPipeline({
      cwd: tmp,
      services,
      namespaceFilter: 'pathService',
      mode: 'diff-only',
    });
    expect(strictDiff.kind).toBe('blocked');
    expect(strictDiff.outcomes[0]?.kind).toBe('blocked');
    expect(strictDiff.outcomes[0]?.context.diff.hasBreaking).toBe(true);
    await expect(
      fs.readFile(getBaselineSchemaPath(tmp, 'pathService'), 'utf8'),
    ).resolves.toBe(pathBaseline);
  });

});
