import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadConfig, resolveAllServices } from '@somedayyoung/core';
import { execPmBuild, execSyncApi } from './lib/pm-exec';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const exampleDir = path.join(repoRoot, 'examples/single-service');
const cliDist = path.join(repoRoot, 'packages/cli/dist/index.js');

function configPath(name: string): string {
  return path.join(exampleDir, name);
}

function resetOutput(relativePath: string): void {
  const target = path.resolve(exampleDir, relativePath);
  if (!target.startsWith(`${path.resolve(exampleDir)}${path.sep}`)) {
    throw new Error(`Refusing to remove path outside example: ${target}`);
  }
  fs.rmSync(target, { recursive: true, force: true });
}

function runConfig(name = 'api-sync.config.ts', extraArgs: string[] = []): void {
  execSyncApi(['run', '--config', `./${name}`, ...extraArgs], {
    cwd: exampleDir,
    stdio: 'pipe',
  });
}

function checkFormatting(filePath: string): void {
  execFileSync(
    process.execPath,
    [
      path.join(exampleDir, 'node_modules/prettier/bin/prettier.cjs'),
      '--check',
      filePath,
    ],
    { cwd: exampleDir, stdio: 'pipe' },
  );
}

beforeAll(() => {
  if (!fs.existsSync(cliDist)) {
    execPmBuild(repoRoot);
  }
});

describe.sequential('examples/single-service config matrix', () => {
  it('uses every default with the minimal config', async () => {
    const config = await loadConfig({
      cwd: exampleDir,
      configPath: configPath('api-sync.config.ts'),
    });
    const [service] = resolveAllServices(config);

    expect(service).toMatchObject({
      namespace: 'main',
      input: { kind: 'file', path: './fixtures/openapi.json' },
      output: {
        dir: './src/api/generated',
        models: 'split',
        format: 'auto',
        keepSpec: false,
      },
      generators: ['typescript', 'sdk'],
      compliance: { strict: false },
    });

    resetOutput('src/api/generated');
    runConfig();

    const output = path.join(exampleDir, 'src/api/generated');
    expect(fs.existsSync(path.join(output, 'models/index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(output, 'sdk.ts'))).toBe(true);
    expect(fs.existsSync(path.join(output, '.api-sync-openapi.json'))).toBe(false);
    expect(
      fs.existsSync(path.join(exampleDir, '.api-sync-cache/main/latest-schema.json')),
    ).toBe(true);
  });

  it('generates models.ts, formats it, and keeps the OpenAPI snapshot', () => {
    resetOutput('src/api/generated-single');
    runConfig('api-sync.config.single.ts');

    const output = path.join(exampleDir, 'src/api/generated-single');
    const sdkPath = path.join(output, 'sdk.ts');

    expect(fs.existsSync(path.join(output, 'models.ts'))).toBe(true);
    expect(fs.existsSync(path.join(output, 'models'))).toBe(false);
    expect(fs.existsSync(path.join(output, '.api-sync-openapi.json'))).toBe(true);
    expect(() => checkFormatting(sdkPath)).not.toThrow();
  });

  it('generates a custom nested type file without unwanted clients', () => {
    resetOutput('src/api/generated-custom');
    runConfig('api-sync.config.custom.ts');

    const output = path.join(exampleDir, 'src/api/generated-custom');
    const typePath = path.join(output, 'contracts/type.ts');
    expect(fs.existsSync(typePath)).toBe(true);
    expect(fs.readFileSync(typePath, 'utf8')).toContain('export type User');
    expect(fs.existsSync(path.join(output, 'sdk.ts'))).toBe(false);
    expect(fs.existsSync(path.join(output, 'hooks.ts'))).toBe(false);
    expect(fs.existsSync(path.join(output, 'zod.ts'))).toBe(false);
    expect(fs.existsSync(path.join(output, '.api-sync-openapi.json'))).toBe(false);
    expect(() => checkFormatting(typePath)).toThrow();
  });

  it('generates SDK, React Query, MSW, and Zod outputs together', () => {
    resetOutput('src/api/generated-all');
    runConfig('api-sync.config.all.ts');

    const output = path.join(exampleDir, 'src/api/generated-all');
    const files = fs.readdirSync(output);
    expect(files).toContain('sdk.ts');
    expect(files).toContain('hooks.ts');
    expect(files).toContain('zod.ts');
    expect(files.some((file) => file.endsWith('.msw.ts'))).toBe(true);
    expect(fs.existsSync(path.join(output, 'models/index.ts'))).toBe(true);
    expect(fs.readFileSync(path.join(output, 'sdk.ts'), 'utf8')).toContain(
      'https://api.example.test',
    );
    expect(() => checkFormatting(path.join(output, 'sdk.ts'))).not.toThrow();
  });

  it('merges global settings and isolates namespace output and cache', async () => {
    const config = await loadConfig({
      cwd: exampleDir,
      configPath: configPath('api-sync.config.multi.ts'),
    });
    const services = resolveAllServices(config);
    const local = services.find((service) => service.namespace === 'local');
    const inherited = services.find((service) => service.namespace === 'inherited');

    expect(local).toMatchObject({
      compliance: { strict: false },
      runtime: {
        baseURL: 'https://api.example.test',
        timeout: 10_000,
        validationRate: 0,
      },
    });
    expect(inherited).toMatchObject({
      compliance: { strict: true },
      runtime: {
        baseURL: 'https://api.example.test',
        timeout: 10_000,
        validationRate: 1,
      },
    });

    resetOutput('src/api/generated-multi');
    resetOutput('.api-sync-cache/local');
    resetOutput('.api-sync-cache/inherited');
    runConfig('api-sync.config.multi.ts', ['--namespace', 'local']);

    expect(
      fs.existsSync(path.join(exampleDir, 'src/api/generated-multi/local/models/index.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(exampleDir, 'src/api/generated-multi/inherited')),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(exampleDir, '.api-sync-cache/local/latest-schema.json')),
    ).toBe(true);
    expect(fs.existsSync(path.join(exampleDir, '.api-sync-cache/inherited'))).toBe(false);

    runConfig('api-sync.config.multi.ts', ['--namespace', 'inherited']);
    expect(
      fs.existsSync(path.join(exampleDir, 'src/api/generated-multi/inherited/models.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(exampleDir, 'src/api/generated-multi/inherited/sdk.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(exampleDir, '.api-sync-cache/inherited/latest-schema.json')),
    ).toBe(true);
  });

  it.each([
    ['missing-output', 'services.main.output'],
    ['invalid-input', 'services.main.input'],
    ['invalid-models', 'services.main.output.models'],
    ['invalid-runtime', 'services.main.runtime.validationRate'],
    ['invalid-namespace', 'services.1main'],
    ['unknown-field', 'services.main'],
  ])('reports the %s config error path', async (fixture, fieldPath) => {
    await expect(
      loadConfig({
        cwd: exampleDir,
        configPath: configPath(`test-configs/api-sync.config.${fixture}.ts`),
      }),
    ).rejects.toThrow(fieldPath);
  });

  it('compiles every generated artifact and valid config', () => {
    execFileSync(
      process.execPath,
      [path.join(repoRoot, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'],
      { cwd: exampleDir, stdio: 'pipe' },
    );
  });
});
