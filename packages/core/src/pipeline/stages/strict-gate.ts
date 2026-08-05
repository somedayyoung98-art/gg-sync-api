import type { GateDecision, PipelineContext } from '../types';

export function runStrictGate(ctx: PipelineContext): GateDecision {
  return ctx.config.compliance.strict && ctx.diff.hasBreaking
    ? { kind: 'blocked', context: ctx }
    : { kind: 'proceed', context: ctx };
}
