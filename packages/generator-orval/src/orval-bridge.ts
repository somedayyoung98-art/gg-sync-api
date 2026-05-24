import fs from 'node:fs/promises';
import path from 'node:path';
import { generate } from 'orval';
import type { PipelineContext } from '@gg-sync/core';
import { loadPluginsForGenerators } from '@gg-sync/core';
import { consolidateModelsToSingleFile } from './consolidate-models.js';
import { mapToOrvalConfig } from './map-config.js';

export async function runOrvalGenerate(ctx: PipelineContext): Promise<void> {
  const loadIssues = await loadPluginsForGenerators(ctx.config.generators);
  if (loadIssues.length > 0) {
    const msg = loadIssues.map((i) => `${i.packageName}: ${i.installHint}`).join('\n');
    throw new Error(`Missing optional plugin packages:\n${msg}`);
  }
  await fs.mkdir(ctx.meta.outputDir, { recursive: true });

  const tmpSpec = path.join(ctx.meta.outputDir, '.api-sync-openapi.json');
  await fs.writeFile(tmpSpec, ctx.contract.raw, 'utf-8');

  const mapped = mapToOrvalConfig(ctx);

  await generate({
    input: mapped.input,
    output: mapped.output,
  });

  if (ctx.config.output.models === 'single') {
    await consolidateModelsToSingleFile(ctx.meta.outputDir);
  }
}
