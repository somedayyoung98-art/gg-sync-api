import path from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { ResolvedServiceConfig } from '../pipeline/types';
import type { APIContract, OpenAPIDocument } from '../pipeline/types';
import { hashSchema } from './hash';

export async function pullSchema(
  cwd: string,
  config: ResolvedServiceConfig,
): Promise<APIContract> {
  const source =
    config.input.kind === 'file'
      ? path.resolve(cwd, config.input.path)
      : config.input.url;

  const bundled = (await SwaggerParser.bundle(source)) as OpenAPIDocument;
  await SwaggerParser.validate(structuredClone(bundled));
  const bundledRaw = JSON.stringify(bundled);

  return {
    raw: bundledRaw,
    parsed: bundled,
    hash: hashSchema(bundledRaw),
  };
}
