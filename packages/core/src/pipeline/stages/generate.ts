import { getGenerator } from '../../plugins/registry.js';
import type { PipelineContext } from '../types.js';

export async function runGenerateStage(ctx: PipelineContext): Promise<PipelineContext> {
  if (ctx.meta.exitCode !== 0) return ctx;

  const seen = new Set<string>();
  for (const id of ctx.config.generators) {
    if (seen.has(id)) continue;
    seen.add(id);
    const plugin = getGenerator(id);
    if (!plugin) {
      throw new Error(
        `Generator "${id}" not registered. Install the matching @gg-sync/plugin-* package.`,
      );
    }
    await plugin.generate(ctx);
  }
  return ctx;
}
