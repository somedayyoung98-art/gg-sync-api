import path from 'node:path';
import { pullSchema } from '../../schema/puller.js';
import { readBaseline } from '../../cache/store.js';
import type { PipelineContext } from '../types.js';
import type { ResolvedServiceConfig } from '../types.js';

export async function runPullStage(
  cwd: string,
  config: ResolvedServiceConfig,
): Promise<PipelineContext> {
  const contract = await pullSchema(cwd, config);
  const baseline = await readBaseline(cwd, config.namespace);
  const outputDir = path.resolve(cwd, config.output.dir);

  return {
    cwd,
    namespace: config.namespace,
    config,
    contract,
    baseline,
    diff: null,
    meta: {
      outputDir,
      strictMode: config.compliance.strict,
      hasBreakingChange: false,
      exitCode: 0,
    },
  };
}
