import type { GeneratorId, PipelineContext } from '../pipeline/types';

export interface GeneratorPlugin {
  readonly id: GeneratorId;
  readonly peerDependencies?: Record<string, string>;
  generate(ctx: PipelineContext): Promise<void>;
}
