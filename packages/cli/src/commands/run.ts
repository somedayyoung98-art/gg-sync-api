import path from 'node:path';
import pc from 'picocolors';
import {
  formatDiffReport,
  loadConfig,
  resolveAllServices,
  runPipeline,
} from '@somedayyoung/core';
import { createDelayedSpinner, createSpinner, log } from '../ui/logger';
import { resolveConfigPath } from '../resolve-config-path';
import { resolveNamespaceFilter, resolveStrictFlag } from '../options';

export interface RunCommandOptions {
  /** CLI `--config` (cac) */
  config?: string;
  configPath?: string;
  strict?: boolean;
  cwd?: string;
  namespace?: string;
}

export async function runCommand(options: RunCommandOptions = {}): Promise<number> {
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

  const runSpinner = createDelayedSpinner('Running API sync pipeline');
  const result = await runPipeline({ cwd, services, namespaceFilter });
  runSpinner.stop();

  for (const outcome of result.outcomes) {
    const ctx = outcome.context;
    const status = outcome.kind === 'success' ? pc.green('ok') : pc.red('fail');
    console.log(
      `${status} ${log.bold(ctx.config.namespace)} -> ${ctx.outputDir} ${pc.dim(`(${ctx.diff.summary})`)}`,
    );
  }

  if (result.kind === 'blocked') {
    log.fail('Pipeline failed');
    for (const outcome of result.outcomes) {
      if (outcome.kind === 'blocked') {
        console.error(formatDiffReport(outcome.context.diff));
      }
    }
  } else {
    log.ok('API Sync completed successfully.');
  }

  return result.kind === 'blocked' ? 1 : 0;
}
