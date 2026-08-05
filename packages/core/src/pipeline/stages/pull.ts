import path from 'node:path';
import { pullSchema } from '../../schema/puller';
import { readBaseline } from '../../cache/store';
import type { PulledContext } from '../types';
import type { ResolvedServiceConfig } from '../types';

export async function runPullStage(
  cwd: string,
  config: ResolvedServiceConfig,
): Promise<PulledContext> {
  const contract = await pullSchema(cwd, config);
  const baseline = await readBaseline(cwd, config.namespace);
  const outputDir = path.resolve(cwd, config.output.dir);

  return {
    cwd,
    config,
    contract,
    baseline,
    outputDir,
  };
}
