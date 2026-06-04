import { writeBaseline } from '../../cache/store';
import type { PipelineContext } from '../types';

export async function runCacheWriteStage(ctx: PipelineContext): Promise<PipelineContext> {
  if (ctx.meta.exitCode !== 0) return ctx;

  await writeBaseline(
    ctx.cwd,
    ctx.namespace,
    ctx.contract.parsed,
    ctx.contract.hash,
  );
  return ctx;
}
