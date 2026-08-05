import fs from 'node:fs/promises';
import path from 'node:path';
import { generate } from 'orval';
import type { PipelineContext } from '@somedayyoung/core';
import { generateSingleModels } from './generate-single-models';
import { generateBusinessApis } from './generate-business-apis';
import {
  createOrvalGenerationPasses,
  mapToOrvalConfig,
} from './map-config';
import { pruneClientArtifacts } from './prune-client-artifacts';
import { writeSdkRequest } from './sdk-request';

export async function runOrvalGenerate(ctx: PipelineContext): Promise<void> {
  await fs.rm(ctx.outputDir, { recursive: true, force: true });
  await fs.mkdir(ctx.outputDir, { recursive: true });

  const keepSpec = ctx.config.output.keepSpec;
  const specPath = path.join(ctx.outputDir, '.api-sync-openapi.json');

  await fs.writeFile(specPath, ctx.contract.raw, 'utf-8');

  if (ctx.config.generators.includes('sdk')) {
    await writeSdkRequest(ctx.outputDir);
  }

  const passes = createOrvalGenerationPasses(ctx.config.generators);
  for (const pass of passes) {
    const mapped = mapToOrvalConfig(ctx, specPath, pass);
    await generate({
      input: mapped.input,
      output: mapped.output,
    });
  }

  if (ctx.config.output.models !== 'split') {
    const file =
      ctx.config.output.models === 'single'
        ? 'models.ts'
        : ctx.config.output.models.file;
    await generateSingleModels(ctx, file);
  }

  await generateBusinessApis(ctx);

  await pruneClientArtifacts(ctx.outputDir, ctx.config.generators);

  if (!keepSpec) {
    await fs.rm(specPath, { force: true });
  }
}
