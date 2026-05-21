import type { ResolvedServiceConfig } from './types.js';
import type { PipelineContext, StageResult } from './types.js';
import { filterServicesByNamespace } from './namespace.js';
import { runPullStage } from './stages/pull.js';
import { runDiffStage } from './stages/diff.js';
import { runStrictGate } from './stages/strict-gate.js';
import { runGenerateStage } from './stages/generate.js';
import { runFormatStage } from './stages/format.js';
import { runCacheWriteStage } from './stages/cache-write.js';
import { assertDoctorPassed, runDoctorStage } from './stages/doctor.js';

export interface RunPipelineOptions {
  cwd: string;
  services: ResolvedServiceConfig[];
  namespaceFilter?: string;
}

export type PipelineMode = 'full' | 'diff-only';

export interface NamespaceRunResult {
  namespace: string;
  exitCode: number;
  outputDir: string;
}

export interface PipelineRunResult {
  contexts: PipelineContext[];
  exitCode: number;
  stages: StageResult[];
  /** Per-namespace outcomes (aggregated exitCode is 1 if any namespace failed). */
  namespaces: NamespaceRunResult[];
}

export async function runPipeline(
  options: RunPipelineOptions & { mode?: PipelineMode },
): Promise<PipelineRunResult> {
  const mode = options.mode ?? 'full';
  const services = filterServicesByNamespace(
    options.services,
    options.namespaceFilter,
  );

  const contexts: PipelineContext[] = [];
  const stages: StageResult[] = [];
  let exitCode = 0;

  const doctorResult = await timed(stages, 'doctor', async () => {
    const result = await runDoctorStage(options.cwd, services);
    assertDoctorPassed(result);
    return result;
  });

  void doctorResult;

  for (const service of services) {
    let ctx = await timed(stages, 'pull', () =>
      runPullStage(options.cwd, service),
    );
    ctx = await timed(stages, 'diff', () => runDiffStage(ctx));
    ctx = runStrictGate(ctx);
    if (ctx.meta.exitCode !== 0) {
      contexts.push(ctx);
      exitCode = 1;
      continue;
    }

    if (mode === 'diff-only') {
      contexts.push(ctx);
      continue;
    }

    ctx = await timed(stages, 'generate', () => runGenerateStage(ctx));
    ctx = await timed(stages, 'format', () => runFormatStage(ctx));
    ctx = await timed(stages, 'cache-write', () => runCacheWriteStage(ctx));
    contexts.push(ctx);
    if (ctx.meta.exitCode !== 0) exitCode = 1;
  }

  const namespaces: NamespaceRunResult[] = contexts.map((ctx) => ({
    namespace: ctx.namespace,
    exitCode: ctx.meta.exitCode,
    outputDir: ctx.meta.outputDir,
  }));

  return { contexts, exitCode, stages, namespaces };
}

async function timed<T>(
  stages: StageResult[],
  name: StageResult['name'],
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    stages.push({ name, durationMs: Date.now() - start });
    return result;
  } catch (e) {
    stages.push({
      name,
      durationMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}
