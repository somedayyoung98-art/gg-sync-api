import path from 'node:path';
import pc from 'picocolors';
import {
  formatDiffReport,
  loadConfig,
  resolveAllServices,
  runPipeline,
} from '@somedayyoung/core';
import type { SharedCommandOptions } from '../options';
import { resolveConfigPath } from '../resolve-config-path';
import { resolveNamespaceFilter, resolveStrictFlag } from '../options';
import { createDelayedSpinner, createSpinner, log } from '../ui/logger';

export async function diffCommand(
  options: SharedCommandOptions = {},
): Promise<number> {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const configPath = resolveConfigPath(cwd, options);

  const spinner = createSpinner('Loading configuration');
  const config = await loadConfig({ cwd, configPath });
  const services = resolveAllServices(config, resolveStrictFlag(options.strict));
  const namespaceFilter = resolveNamespaceFilter(services, options.namespace);
  spinner.succeed(
    namespaceFilter
      ? `Configuration loaded (namespace: ${namespaceFilter})`
      : `Configuration loaded (${services.length} namespaces)`,
  );

  const runSpinner = createDelayedSpinner('Running contract diff');
  const result = await runPipeline({
    cwd,
    services,
    namespaceFilter,
    mode: 'diff-only',
  });
  runSpinner.stop();

  for (const outcome of result.outcomes) {
    const ctx = outcome.context;
    const status = outcome.kind === 'success' ? pc.green('ok') : pc.red('fail');
    console.log(
      `${status} ${log.bold(ctx.config.namespace)} ${pc.dim(`(${ctx.diff.summary})`)}`,
    );
    if (ctx.diff.breaking.length > 0 || ctx.diff.nonBreaking.length > 0) {
      console.log(pc.dim(formatDiffReport(ctx.diff)));
    }
  }

  if (result.kind === 'blocked') {
    log.fail('Diff failed (breaking changes in strict mode)');
  }

  return result.kind === 'blocked' ? 1 : 0;
}
