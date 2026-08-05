import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';
import type { PipelineContext } from '@somedayyoung/core';

export async function generateSingleModels(
  context: PipelineContext,
  specPath: string,
  file: string,
): Promise<void> {
  const ast = await openapiTS(pathToFileURL(specPath), {
    rootTypes: true,
    rootTypesNoSchemaPrefix: true,
  });
  const parsedPath = path.parse(file);
  await fs.writeFile(
    path.join(context.outputDir, file),
    astToString(ast),
    'utf8',
  );
  await fs.rm(path.join(context.outputDir, parsedPath.dir, parsedPath.name), {
    recursive: true,
    force: true,
  });
}
