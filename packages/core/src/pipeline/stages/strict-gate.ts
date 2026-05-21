import { formatDiffReport } from '../../diff/format-report.js';
import type { PipelineContext } from '../types.js';

/**
 * Strict mode: exit 1 on breaking diff; downstream stages skip cache-write when exitCode !== 0.
 */
export function runStrictGate(ctx: PipelineContext): PipelineContext {
  if (!ctx.diff?.hasBreaking) return ctx;

  if (ctx.meta.strictMode) {
    console.error(formatDiffReport(ctx.diff));
    return {
      ...ctx,
      meta: { ...ctx.meta, exitCode: 1 },
    };
  }

  return ctx;
}
