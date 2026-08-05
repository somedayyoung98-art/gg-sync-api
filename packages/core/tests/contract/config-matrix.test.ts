import { afterEach, describe, expect, it } from 'vitest';
import { apiSyncConfigSchema } from '../../src/config/schema';
import { resolveAllServices } from '../../src/config/load';

function minimalConfig(): Record<string, unknown> {
  return {
    services: {
      main: {
        input: { path: './openapi.json' },
        output: { dir: './src/api/generated' },
      },
    },
  };
}

describe('complete config contract', () => {
  const previousStrict = process.env.API_SYNC_STRICT;

  afterEach(() => {
    if (previousStrict === undefined) {
      delete process.env.API_SYNC_STRICT;
    } else {
      process.env.API_SYNC_STRICT = previousStrict;
    }
  });

  it('parses every supported config field and preserves boundary values', () => {
    const config = apiSyncConfigSchema.parse({
      compliance: { strict: true },
      runtime: {
        baseURL: 'https://api.example.com',
        timeout: 15_000,
        validationRate: 0,
      },
      services: {
        path_service: {
          input: { path: './contracts/path.json' },
          output: {
            dir: './src/api/path',
            models: 'split',
            format: 'auto',
            keepSpec: true,
          },
          generators: ['typescript', 'sdk', 'react-query', 'msw', 'zod'],
          compliance: { strict: false },
          runtime: {
            baseURL: '/api/path',
            timeout: 2_000,
            validationRate: 1,
          },
        },
        urlService: {
          input: { url: 'https://api.example.com/openapi.json' },
          output: {
            dir: './src/api/url',
            models: { file: 'type.ts' },
            format: 'prettier',
            keepSpec: false,
          },
          generators: [],
        },
        noFormat: {
          input: { path: './contracts/no-format.json' },
          output: {
            dir: './src/api/no-format',
            format: false,
          },
        },
      },
    });

    const [pathService, urlService, noFormat] = resolveAllServices(config);

    expect(pathService).toMatchObject({
      namespace: 'path_service',
      input: { kind: 'file', path: './contracts/path.json' },
      output: {
        models: 'split',
        format: 'auto',
        keepSpec: true,
      },
      generators: ['typescript', 'sdk', 'react-query', 'msw', 'zod'],
      compliance: { strict: false },
      runtime: {
        baseURL: '/api/path',
        timeout: 2_000,
        validationRate: 1,
      },
    });
    expect(urlService).toMatchObject({
      namespace: 'urlService',
      input: {
        kind: 'url',
        url: 'https://api.example.com/openapi.json',
      },
      output: {
        models: { file: 'type.ts' },
        format: 'prettier',
        keepSpec: false,
      },
      generators: [],
      compliance: { strict: true },
      runtime: {
        baseURL: 'https://api.example.com',
        timeout: 15_000,
        validationRate: 0,
      },
    });
    expect(noFormat).toMatchObject({
      output: { format: false, keepSpec: false },
      generators: ['typescript', 'sdk'],
    });
  });

  it.each([
    ['empty services', { services: {} }],
    [
      'invalid namespace',
      {
        services: {
          '9bad': {
            input: { path: './openapi.json' },
            output: { dir: './out' },
          },
        },
      },
    ],
    [
      'missing input source',
      {
        services: {
          main: { input: {}, output: { dir: './out' } },
        },
      },
    ],
    [
      'both input sources',
      {
        services: {
          main: {
            input: {
              path: './openapi.json',
              url: 'https://example.com/api.json',
            },
            output: { dir: './out' },
          },
        },
      },
    ],
    [
      'invalid input URL',
      {
        services: {
          main: {
            input: { url: 'not-a-url' },
            output: { dir: './out' },
          },
        },
      },
    ],
    [
      'empty output directory',
      {
        services: {
          main: {
            input: { path: './openapi.json' },
            output: { dir: '' },
          },
        },
      },
    ],
    [
      'invalid models mode',
      {
        services: {
          main: {
            input: { path: './openapi.json' },
            output: { dir: './out', models: 'tags' },
          },
        },
      },
    ],
    [
      'invalid format mode',
      {
        services: {
          main: {
            input: { path: './openapi.json' },
            output: { dir: './out', format: true },
          },
        },
      },
    ],
    [
      'single models file without .ts extension',
      {
        services: {
          main: {
            input: { path: './openapi.json' },
            output: { dir: './out', models: { file: 'types' } },
          },
        },
      },
    ],
    [
      'single models file outside output directory',
      {
        services: {
          main: {
            input: { path: './openapi.json' },
            output: { dir: './out', models: { file: '../types.ts' } },
          },
        },
      },
    ],
    [
      'absolute single models file',
      {
        services: {
          main: {
            input: { path: './openapi.json' },
            output: { dir: './out', models: { file: 'C:\\types.ts' } },
          },
        },
      },
    ],
    [
      'unknown generator',
      {
        services: {
          main: {
            input: { path: './openapi.json' },
            output: { dir: './out' },
            generators: ['graphql'],
          },
        },
      },
    ],
    [
      'non-positive timeout',
      {
        ...minimalConfig(),
        runtime: { timeout: 0 },
      },
    ],
    [
      'validation rate below zero',
      {
        ...minimalConfig(),
        runtime: { validationRate: -0.01 },
      },
    ],
    [
      'validation rate above one',
      {
        ...minimalConfig(),
        runtime: { validationRate: 1.01 },
      },
    ],
    [
      'unknown root field',
      {
        ...minimalConfig(),
        unsupported: true,
      },
    ],
    [
      'unknown service field',
      {
        services: {
          main: {
            input: { path: './openapi.json' },
            output: { dir: './out' },
            unsupported: true,
          },
        },
      },
    ],
  ])('rejects %s', (_name, config) => {
    expect(apiSyncConfigSchema.safeParse(config).success).toBe(false);
  });

  it('applies strict precedence as CLI, env, service, global, default', () => {
    const config = apiSyncConfigSchema.parse({
      compliance: { strict: true },
      services: {
        inherited: {
          input: { path: './inherited.json' },
          output: { dir: './inherited' },
        },
        overridden: {
          input: { path: './overridden.json' },
          output: { dir: './overridden' },
          compliance: { strict: false },
        },
      },
    });

    delete process.env.API_SYNC_STRICT;
    expect(
      resolveAllServices(config).map((service) => service.compliance.strict),
    ).toEqual([true, false]);

    process.env.API_SYNC_STRICT = '1';
    expect(
      resolveAllServices(config).map((service) => service.compliance.strict),
    ).toEqual([true, true]);
    expect(
      resolveAllServices(config, false).map(
        (service) => service.compliance.strict,
      ),
    ).toEqual([false, false]);

    delete process.env.API_SYNC_STRICT;
    const defaultConfig = apiSyncConfigSchema.parse(minimalConfig());
    expect(resolveAllServices(defaultConfig)[0]?.compliance.strict).toBe(false);
  });
});
