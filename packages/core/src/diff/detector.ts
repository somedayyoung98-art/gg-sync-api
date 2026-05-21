import type { OpenAPIV3 } from 'openapi-types';
import type { PipelineContext, DiffReport } from '../pipeline/types.js';
import { runOpenApiDiff } from './openapi-diff-loader.js';
import { mapOpenApiDiffToReport } from './map-matrix.js';

export async function diffOpenApiSpecs(
  baseline: OpenAPIV3.Document,
  incoming: OpenAPIV3.Document,
): Promise<DiffReport> {
  const result = await runOpenApiDiff(baseline, incoming);
  return mapOpenApiDiffToReport(result, baseline, incoming);
}

export async function compareWithCache(ctx: PipelineContext): Promise<DiffReport> {
  if (!ctx.baseline) {
    return {
      hasBreaking: false,
      breaking: [],
      nonBreaking: [],
      summary: 'No local cache found. First initialization.',
    };
  }

  return diffOpenApiSpecs(ctx.baseline, ctx.contract.parsed);
}
