import fs from 'node:fs';
import path from 'node:path';
import type { PipelineContext } from '@gg-sync/core';

export interface OrvalBuildInput {
  target: string;
  workspace: string;
}

export interface OrvalBuildOutput {
  target: string;
  schemas: string;
  client: 'fetch' | 'react-query' | 'axios';
  mode: 'single' | 'split' | 'tags';
  mock?: boolean | { type: 'msw'; baseUrl?: string };
  override?: Record<string, unknown>;
}

export function mapToOrvalConfig(
  ctx: PipelineContext,
  specPath: string,
): {
  input: OrvalBuildInput;
  output: OrvalBuildOutput;
} {
  const out = ctx.meta.outputDir;
  const generators = new Set(ctx.config.generators);

  const useReactQuery = generators.has('react-query');
  const client: OrvalBuildOutput['client'] = useReactQuery ? 'react-query' : 'fetch';
  const artifactTarget = useReactQuery
    ? path.join(out, 'hooks.ts')
    : path.join(out, 'sdk.ts');
  const mutatorPath = path.join(ctx.cwd, 'src/api/runtime/client.ts');

  const override: Record<string, unknown> = {};
  if (!useReactQuery && fs.existsSync(mutatorPath)) {
    override.mutator = {
      path: mutatorPath,
      name: 'customFetch',
    };
  }
  if (generators.has('zod')) {
    override.zod = {
      generate: true,
      strict: false,
      generateEachHttpStatus: false,
    };
  }

  const mswEnabled = generators.has('msw');
  const mockConfig = mswEnabled
    ? {
        type: 'msw' as const,
        baseUrl: ctx.config.runtime?.baseURL ?? 'http://localhost:3000',
      }
    : undefined;

  return {
    input: {
      target: specPath,
      workspace: ctx.cwd,
    },
    output: {
      target: artifactTarget,
      schemas: path.join(out, 'models'),
      client,
      mode: 'split',
      mock: mockConfig,
      override: Object.keys(override).length > 0 ? override : undefined,
    },
  };
}
