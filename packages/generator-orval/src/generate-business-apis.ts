import fs from 'node:fs/promises';
import path from 'node:path';
import {
  camel,
  getOperationId,
  getRoute,
  sanitize,
} from '@orval/core';
import type { PipelineContext } from '@somedayyoung/core';

const verbs = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
] as const;

interface Operation {
  operationId?: string;
  tags?: string[];
}

type PathItem = Partial<Record<(typeof verbs)[number], Operation>>;

export async function generateBusinessApis(
  context: PipelineContext,
): Promise<void> {
  if (!context.config.sdk?.businessApi) return;

  const paths = context.contract.parsed.paths as
    | Record<string, PathItem>
    | undefined;
  const groups = new Map<string, string[]>();

  for (const [pathRoute, pathItem] of Object.entries(paths ?? {})) {
    for (const verb of verbs) {
      const operation = pathItem[verb];
      const tag = operation?.tags?.[0];
      if (!operation || !tag) continue;

      const apiName = sanitize(camel(`${tag} api`), {
        es5keyword: true,
        es5IdentifierName: true,
      });
      const operationId = getOperationId(
        operation as Parameters<typeof getOperationId>[0],
        getRoute(pathRoute),
        verb,
      );
      const operationName = sanitize(camel(operationId), { es5keyword: true });
      const methods = groups.get(apiName) ?? [];
      methods.push(operationName);
      groups.set(apiName, methods);
    }
  }

  if (groups.size === 0) return;

  const declarations = [...groups]
    .map(
      ([apiName, methods]) =>
        `export const ${apiName} = {\n${methods.map((method) => `  ${method},`).join('\n')}\n};`,
    )
    .join('\n\n');
  const sdkPath = path.join(context.outputDir, 'sdk.ts');
  await fs.appendFile(sdkPath, `\n${declarations}\n`, 'utf8');
}
