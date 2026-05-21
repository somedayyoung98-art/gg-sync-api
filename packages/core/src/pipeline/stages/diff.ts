import { compareWithCache } from '../../diff/detector.js';
import type { PipelineContext } from '../types.js';

export async function runDiffStage(ctx: PipelineContext): Promise<PipelineContext> {
  const diff = await compareWithCache(ctx);
  return {
    ...ctx,
    diff,
    meta: {
      ...ctx.meta,
      hasBreakingChange: diff.hasBreaking,
    },
  };
}
