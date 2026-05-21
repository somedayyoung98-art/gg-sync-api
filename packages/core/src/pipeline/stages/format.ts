import type { PipelineContext } from '../types.js';

/** Optional prettier pass — no-op in MVP if prettier not configured */
export async function runFormatStage(ctx: PipelineContext): Promise<PipelineContext> {
  return ctx;
}
