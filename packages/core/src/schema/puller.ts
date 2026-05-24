import path from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV3 } from 'openapi-types';
import type { ResolvedServiceConfig } from '../pipeline/types.js';
import type { APIContract } from '../pipeline/types.js';
import { hashSchema } from './hash.js';
import { normalizeOpenApiForTooling } from './normalize-openapi.js';

export async function pullSchema(
  cwd: string,
  config: ResolvedServiceConfig,
): Promise<APIContract> {
  let parsed: OpenAPIV3.Document;

  if (config.input.path) {
    const filePath = path.resolve(cwd, config.input.path);
    parsed = (await SwaggerParser.parse(filePath)) as OpenAPIV3.Document;
  } else if (config.input.url) {
    parsed = (await SwaggerParser.parse(config.input.url)) as OpenAPIV3.Document;
  } else {
    throw new Error(`Namespace "${config.namespace}": no input.url or input.path`);
  }

  const bundled = normalizeOpenApiForTooling(
    (await SwaggerParser.bundle(parsed)) as OpenAPIV3.Document,
  );
  const bundledRaw = JSON.stringify(bundled);

  return {
    raw: bundledRaw,
    parsed: bundled,
    hash: hashSchema(bundledRaw),
  };
}
