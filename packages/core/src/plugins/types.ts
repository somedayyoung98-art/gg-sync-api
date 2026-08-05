import type { PipelineContext } from '../pipeline/types';

export type CodeGenerator = (context: PipelineContext) => Promise<void>;
