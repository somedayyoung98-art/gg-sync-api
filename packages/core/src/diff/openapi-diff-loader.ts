import { createRequire } from 'node:module';
import type { OpenApiDiffResult } from './types.js';

const require = createRequire(import.meta.url);

interface DiffSpecsFn {
  (args: {
    sourceSpec: { content: string; location: string; format: 'openapi3' };
    destinationSpec: { content: string; location: string; format: 'openapi3' };
  }): Promise<OpenApiDiffResult>;
}

const openapiDiff = require('openapi-diff') as { diffSpecs: DiffSpecsFn };

export async function runOpenApiDiff(
  baseline: unknown,
  incoming: unknown,
): Promise<OpenApiDiffResult> {
  return openapiDiff.diffSpecs({
    sourceSpec: {
      content: JSON.stringify(baseline),
      location: 'baseline',
      format: 'openapi3',
    },
    destinationSpec: {
      content: JSON.stringify(incoming),
      location: 'incoming',
      format: 'openapi3',
    },
  });
}
