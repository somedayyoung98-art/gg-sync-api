import { describe, expect, it } from 'vitest';
import { apiSyncConfigSchema } from '../../src/config/schema.js';

describe('apiSyncConfigSchema', () => {
  it('accepts valid single-service config', () => {
    const result = apiSyncConfigSchema.parse({
      services: {
        main: {
          input: { path: './openapi.json' },
          output: { dir: './src/api/generated' },
          generators: ['typescript', 'sdk'],
        },
      },
    });
    expect(result.services.main.generators).toEqual(['typescript', 'sdk']);
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

  it('rejects duplicate output.dir across namespaces', () => {
    expect(() =>
      apiSyncConfigSchema.parse({
        services: {
          user: {
            input: { path: './a.json' },
            output: { dir: './src/api/generated' },
          },
          billing: {
            input: { path: './b.json' },
            output: { dir: './src/api/generated' },
          },
        },
      }),
    ).toThrow(/unique output\.dir/);
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
});
