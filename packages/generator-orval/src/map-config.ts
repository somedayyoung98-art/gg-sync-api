import path from 'node:path';
import type { GeneratorId, PipelineContext } from '@somedayyoung/core';

export interface OrvalBuildInput {
  target: string;
  workspace: string;
}

export interface OrvalBuildOutput {
  target: string;
  schemas?: string;
  client: 'fetch' | 'react-query' | 'zod' | 'axios-functions';
  httpClient?: 'fetch' | 'axios';
  baseUrl?: string;
  mode: 'single' | 'split' | 'tags';
  mock?: boolean | { type: 'msw'; baseUrl?: string };
  override?: Record<string, unknown>;
}

export interface OrvalGenerationPass {
  client: 'fetch' | 'react-query' | 'zod' | 'axios-functions';
  includeExtras: boolean;
}

export function createOrvalGenerationPasses(
  generators: readonly GeneratorId[],
): OrvalGenerationPass[] {
  const enabled = new Set(generators);
  const passes: OrvalGenerationPass[] = [];

  if (enabled.has('sdk') || !enabled.has('react-query')) {
    passes.push({
      client: enabled.has('sdk') ? 'axios-functions' : 'fetch',
      includeExtras: true,
    });
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
    pass?.client ??
    (generators.has('react-query')
      ? 'react-query'
      : generators.has('sdk')
        ? 'axios-functions'
        : 'fetch');
  const useReactQuery = selectedClient === 'react-query';
  const useZod = selectedClient === 'zod';
  const useSdk = selectedClient === 'axios-functions';
  const includeExtras = pass?.includeExtras ?? true;
  const client: OrvalBuildOutput['client'] = useZod
    ? 'zod'
    : useReactQuery
      ? 'react-query'
      : useSdk
        ? 'axios-functions'
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
  const mutatorPath = path.join(ctx.outputDir, 'sdk-request.ts');

  const override: Record<string, unknown> = {};
  if (!useZod && !useSdk) {
    override.fetch = { includeHttpResponseReturnType: false };
  }
  if (useSdk) {
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
