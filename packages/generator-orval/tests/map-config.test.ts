import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { PipelineContext } from '@somedayyoung/core';
import {
  createOrvalGenerationPasses,
  mapToOrvalConfig,
} from '../src/map-config';

function context(
  generators: PipelineContext['config']['generators'],
  cwd = path.resolve('consumer'),
): PipelineContext {
  return {
    cwd,
    config: {
      namespace: 'main',
      input: { kind: 'file', path: './openapi.json' },
      output: {
        dir: './generated',
        models: 'split',
        format: false,
        keepSpec: false,
      },
      generators,
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

describe('Orval generation plan', () => {
  let tmp = '';

  afterEach(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('creates SDK and React Query passes when both are enabled', () => {
    const generators = ['typescript', 'sdk', 'react-query'] as const;
    const passes = createOrvalGenerationPasses(generators);

    expect(passes).toEqual([
      { client: 'fetch', includeExtras: true },
      { client: 'react-query', includeExtras: false },
    ]);

    const ctx = context([...generators]);
    const sdk = mapToOrvalConfig(ctx, 'openapi.json', passes[0]);
    const hooks = mapToOrvalConfig(ctx, 'openapi.json', passes[1]);
    expect(sdk.output.target).toBe(path.join(ctx.outputDir, 'sdk.ts'));
    expect(sdk.output.override?.fetch).toEqual({
      includeHttpResponseReturnType: false,
    });
    expect(hooks.output.target).toBe(path.join(ctx.outputDir, 'hooks.ts'));
    expect(hooks.output.httpClient).toBe('fetch');
  });

  it('uses the React Query pass for extras when no SDK is requested', () => {
    const ctx = context(['typescript', 'react-query', 'msw']);
    ctx.config.runtime = { baseURL: 'https://api.example.test' };
    const passes = createOrvalGenerationPasses(ctx.config.generators);

    expect(passes).toEqual([{ client: 'react-query', includeExtras: true }]);
    const mapped = mapToOrvalConfig(ctx, 'openapi.json', passes[0]);
    expect(mapped.output.mock).toBeDefined();
    expect(mapped.output.baseUrl).toBe('https://api.example.test');
  });

  it('maps zod validation options for every OpenAPI input and response kind', () => {
    const ctx = context(['typescript', 'sdk', 'zod']);
    const passes = createOrvalGenerationPasses(ctx.config.generators);
    expect(passes).toEqual([
      { client: 'fetch', includeExtras: true },
      { client: 'zod', includeExtras: false },
    ]);
    const mapped = mapToOrvalConfig(ctx, 'openapi.json', passes[1]);

    expect(mapped.output.client).toBe('zod');
    expect(mapped.output.target).toBe(path.join(ctx.outputDir, 'zod.ts'));
    expect(mapped.output.schemas).toBeUndefined();
    expect(mapped.output.override?.zod).toEqual({
      generate: {
        param: true,
        query: true,
        header: true,
        body: true,
        response: true,
      },
      strict: {
        param: false,
        query: false,
        header: false,
        body: false,
        response: false,
      },
      generateEachHttpStatus: false,
    });
  });

  it('aligns Orval imports with a custom models file', () => {
    const ctx = context(['typescript', 'sdk']);
    ctx.config.output.models = { file: 'type.ts' };

    const mapped = mapToOrvalConfig(ctx, 'openapi.json');

    expect(mapped.output.schemas).toBe(path.join(ctx.outputDir, 'type'));
  });

  it('keeps models.ts as the single-file default', () => {
    const ctx = context(['typescript', 'sdk']);
    ctx.config.output.models = 'single';

    const mapped = mapToOrvalConfig(ctx, 'openapi.json');

    expect(mapped.output.schemas).toBe(path.join(ctx.outputDir, 'models'));
  });

  it('applies a local fetch mutator only to the fetch pass', () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'api-sync-map-'));
    const runtimeDir = path.join(tmp, 'src/api/runtime');
    fs.mkdirSync(runtimeDir, { recursive: true });
    fs.writeFileSync(
      path.join(runtimeDir, 'client.ts'),
      'export async function customFetch() {}\n',
      'utf8',
    );
    const ctx = context(['typescript', 'sdk', 'zod'], tmp);
    const passes = createOrvalGenerationPasses(ctx.config.generators);

    const fetchConfig = mapToOrvalConfig(ctx, 'openapi.json', passes[0]);
    const zodConfig = mapToOrvalConfig(ctx, 'openapi.json', passes[1]);

    expect(fetchConfig.output.override?.mutator).toBeDefined();
    expect(fetchConfig.output.override?.fetch).toEqual({
      includeHttpResponseReturnType: false,
    });
    expect(zodConfig.output.override?.mutator).toBeUndefined();
    expect(zodConfig.output.override?.fetch).toBeUndefined();
  });
});
