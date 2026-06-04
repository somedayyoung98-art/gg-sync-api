import { compareWithCache } from '../../diff/detector';
import type { PipelineContext } from '../types';

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
