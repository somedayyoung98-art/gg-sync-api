import { compareWithCache } from '../../diff/detector';
import type { PipelineContext, PulledContext } from '../types';

export async function runDiffStage(ctx: PulledContext): Promise<PipelineContext> {
  const diff = await compareWithCache(ctx);
  return {
    ...ctx,
    diff,
  };
}
