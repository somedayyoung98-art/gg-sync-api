import fs from 'node:fs';
import path from 'node:path';
import { initSync, parse } from 'es-module-lexer';
import type { GeneratorId, PipelineContext } from '@somedayyoung/core';

initSync();

export interface OrvalBuildInput {
  target: string;
  workspace: string;
}

export interface OrvalBuildOutput {
  target: string;
  schemas?: string;
  client: 'fetch' | 'react-query' | 'zod' | 'axios';
  httpClient?: 'fetch' | 'axios';
  baseUrl?: string;
  mode: 'single' | 'split' | 'tags';
  mock?: boolean | { type: 'msw'; baseUrl?: string };
  override?: Record<string, unknown>;
}

export interface OrvalGenerationPass {
  client: 'fetch' | 'react-query' | 'zod';
  includeExtras: boolean;
}

function hasLocalCustomFetch(mutatorPath: string): boolean {
  if (!fs.existsSync(mutatorPath)) return false;
  const [, exports] = parse(fs.readFileSync(mutatorPath, 'utf8'));
  return exports.some(
    ({ n, ln }) => n === 'customFetch' && ln === 'customFetch',
  );
}

export function createOrvalGenerationPasses(
  generators: readonly GeneratorId[],
): OrvalGenerationPass[] {
  const enabled = new Set(generators);
  const passes: OrvalGenerationPass[] = [];

  if (enabled.has('sdk') || !enabled.has('react-query')) {
    passes.push({ client: 'fetch', includeExtras: true });
  }
  if (enabled.has('react-query')) {
    passes.push({
      client: 'react-query',
      includeExtras: passes.length === 0,
    });
  }
  if (enabled.has('zod')) {
    passes.push({ client: 'zod', includeExtras: false });
  }

  return passes;
}

export function mapToOrvalConfig(
  ctx: PipelineContext,
  specPath: string,
  pass?: OrvalGenerationPass,
): {
  input: OrvalBuildInput;
  output: OrvalBuildOutput;
} {
  const out = ctx.outputDir;
  const generators = new Set(ctx.config.generators);

  const selectedClient =
    pass?.client ?? (generators.has('react-query') ? 'react-query' : 'fetch');
  const useReactQuery = selectedClient === 'react-query';
  const useZod = selectedClient === 'zod';
  const includeExtras = pass?.includeExtras ?? true;
  const client: OrvalBuildOutput['client'] = useZod
    ? 'zod'
    : useReactQuery
      ? 'react-query'
      : 'fetch';
  const artifactTarget = useZod
    ? path.join(out, 'zod.ts')
    : useReactQuery
      ? path.join(out, 'hooks.ts')
      : path.join(out, 'sdk.ts');
  const models = ctx.config.output.models;
  const modelsFile = models === 'single' ? { file: 'models.ts' } : models;
  const schemas =
    modelsFile === 'split'
      ? path.join(out, 'models')
      : path.join(
          out,
          path.dirname(modelsFile.file),
          path.basename(modelsFile.file, '.ts'),
        );
  const mutatorPath = path.join(ctx.cwd, 'src/api/runtime/client.ts');

  const override: Record<string, unknown> = {};
  if (!useZod) {
    override.fetch = { includeHttpResponseReturnType: false };
  }
  if (selectedClient === 'fetch' && hasLocalCustomFetch(mutatorPath)) {
    override.mutator = {
      path: mutatorPath,
      name: 'customFetch',
    };
  }
  if (useZod) {
    const schemaKinds = {
      param: true,
      query: true,
      header: true,
      body: true,
      response: true,
    };
    override.zod = {
      generate: schemaKinds,
      strict: {
        param: false,
        query: false,
        header: false,
        body: false,
        response: false,
      },
      generateEachHttpStatus: false,
    };
  }

  const mswEnabled = includeExtras && generators.has('msw');
  const mockConfig = mswEnabled
    ? {
        type: 'msw' as const,
        baseUrl: ctx.config.runtime?.baseURL,
      }
    : undefined;

  return {
    input: {
      target: specPath,
      workspace: ctx.cwd,
    },
    output: {
      target: artifactTarget,
      schemas: useZod ? undefined : schemas,
      client,
      httpClient: useReactQuery ? 'fetch' : undefined,
      baseUrl: useZod ? undefined : ctx.config.runtime?.baseURL,
      mode: 'split',
      mock: mockConfig,
      override: Object.keys(override).length > 0 ? override : undefined,
    },
  };
}
