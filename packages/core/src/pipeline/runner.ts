import type { ResolvedServiceConfig } from './types';
import type { PipelineContext } from './types';
import { filterServicesByNamespace } from './namespace';
import { runPullStage } from './stages/pull';
import { runDiffStage } from './stages/diff';
import { runStrictGate } from './stages/strict-gate';
import { runFormatStage } from './stages/format';
import { generateCode } from '../plugins/registry';
import { writeBaseline } from '../cache/store';

export interface RunPipelineOptions {
  cwd: string;
  services: ResolvedServiceConfig[];
  namespaceFilter?: string;
}

export type PipelineMode = 'full' | 'diff-only';

export type ServiceOutcome =
  | { readonly kind: 'success'; readonly context: PipelineContext }
  | { readonly kind: 'blocked'; readonly context: PipelineContext };

export interface PipelineRunResult {
  readonly kind: 'success' | 'blocked';
  readonly outcomes: readonly ServiceOutcome[];
}

export async function runPipeline(
  options: RunPipelineOptions & { mode?: PipelineMode },
): Promise<PipelineRunResult> {
  const mode = options.mode ?? 'full';
  const services = filterServicesByNamespace(
    options.services,
    options.namespaceFilter,
  );

  const outcomes: ServiceOutcome[] = [];

  for (const service of services) {
    const pulled = await runPullStage(options.cwd, service);
    const compared = await runDiffStage(pulled);
    const gate = runStrictGate(compared);
    if (gate.kind === 'blocked') {
      outcomes.push(gate);
      continue;
    }

    if (mode === 'diff-only') {
      outcomes.push({ kind: 'success', context: gate.context });
      continue;
    }

    await generateCode(gate.context);
    const formatted = await runFormatStage(gate.context);
    await writeBaseline(
      formatted.cwd,
      formatted.config.namespace,
      formatted.contract.parsed,
      formatted.contract.hash,
    );
    outcomes.push({ kind: 'success', context: formatted });
  }

  const kind = outcomes.some((outcome) => outcome.kind === 'blocked')
    ? 'blocked'
    : 'success';
  return { kind, outcomes };
}
