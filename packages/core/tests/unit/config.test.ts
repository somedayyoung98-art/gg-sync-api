import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { apiSyncConfigSchema, defineConfig } from '../../src/config/schema';
import { loadConfig, resolveAllServices } from '../../src/config/load';

describe('apiSyncConfigSchema', () => {
  const previousStrict = process.env.API_SYNC_STRICT;

  afterEach(() => {
    if (previousStrict === undefined) {
      delete process.env.API_SYNC_STRICT;
    } else {
      process.env.API_SYNC_STRICT = previousStrict;
    }
  });

  it('accepts valid single-service config', () => {
    const result = apiSyncConfigSchema.parse(defineConfig({
      services: {
        main: {
          input: { path: './openapi.json' },
          output: { dir: './src/api/generated', format: 'prettier' },
          generators: ['typescript', 'sdk'],
        },
      },
    }));
    expect(result.services.main.generators).toEqual(['typescript', 'sdk']);
    expect(result.services.main.output.format).toBe('prettier');
  });

  it('accepts multi-service config with distinct output dirs', () => {
    const result = apiSyncConfigSchema.parse({
      services: {
        user: {
          input: { path: './contracts/user.json' },
          output: { dir: './src/api/user/generated' },
        },
        billing: {
          input: { path: './contracts/billing.json' },
          output: { dir: './src/api/billing/generated' },
        },
      },
    });
    expect(Object.keys(result.services).sort()).toEqual(['billing', 'user']);
  });

  it('rejects invalid namespace keys', () => {
    expect(() =>
      apiSyncConfigSchema.parse({
        services: {
          '9bad': {
            input: { path: './a.json' },
            output: { dir: './out/a' },
          },
        },
      }),
    ).toThrow();
  });

  it('rejects config without url or path', () => {
    expect(() =>
      apiSyncConfigSchema.parse({
        services: {
          main: {
            input: {},
            output: { dir: './out' },
          },
        },
      }),
    ).toThrow();
  });

  it('respects service strict config when CLI and env do not override it', () => {
    delete process.env.API_SYNC_STRICT;
    const config = apiSyncConfigSchema.parse({
      services: {
        main: {
          input: { path: './openapi.json' },
          output: { dir: './out' },
          compliance: { strict: true },
        },
      },
    });

    expect(resolveAllServices(config)[0]?.compliance.strict).toBe(true);
  });

  it('lets API_SYNC_STRICT=1 enable strict over config false', () => {
    process.env.API_SYNC_STRICT = '1';
    const config = apiSyncConfigSchema.parse({
      compliance: { strict: false },
      services: {
        main: {
          input: { path: './openapi.json' },
          output: { dir: './out' },
        },
      },
    });

    expect(resolveAllServices(config)[0]?.compliance.strict).toBe(true);
  });

  it('defaults output format to auto when resolving services', () => {
    const config = apiSyncConfigSchema.parse({
      services: {
        main: {
          input: { path: './openapi.json' },
          output: { dir: './out' },
        },
      },
    });

    expect(resolveAllServices(config)[0]?.output.format).toBe('auto');
  });

  it('reports the path of a missing required config field', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-config-'));
    const configPath = path.join(cwd, 'api-sync.config.ts');
    await fs.writeFile(
      configPath,
      `export default {
        services: {
          main: { input: { path: './openapi.json' } }
        }
      }`,
      'utf8',
    );

    try {
      await expect(loadConfig({ cwd, configPath })).rejects.toThrow(
        /Invalid API Sync config:.*services\.main\.output/,
      );
    } finally {
      await fs.rm(cwd, { recursive: true, force: true });
    }
  });
});
