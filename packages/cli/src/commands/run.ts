import path from 'node:path';
import pc from 'picocolors';
import {
  formatDiffReport,
  loadConfig,
  resolveAllServices,
  runPipeline,
} from '@gg-sync/core';
import { createDelayedSpinner, createSpinner, log } from '../ui/logger.js';
import { resolveConfigPath } from '../resolve-config-path.js';
import { resolveNamespaceFilter, resolveStrictFlag } from '../options.js';

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

  try {
    const config = await loadConfig({ cwd, configPath });
    const services = resolveAllServices(config, resolveStrictFlag(options.strict));
    const namespaceFilter = resolveNamespaceFilter(services, options.namespace);
    spinner.succeed(
      namespaceFilter
        ? `Configuration loaded (namespace: ${namespaceFilter})`
        : `Configuration loaded (${services.length} namespaces)`,
    );

    const runSpinner = createDelayedSpinner('Running API sync pipeline');
    const result = await runPipeline({
      cwd,
      services,
      namespaceFilter,
    });
    runSpinner.stop();

    for (const ctx of result.contexts) {
      const status = ctx.meta.exitCode === 0 ? pc.green('ok') : pc.red('fail');
      console.log(
        `${status} ${log.bold(ctx.namespace)} → ${ctx.meta.outputDir} ${ctx.diff?.summary ? pc.dim(`(${ctx.diff.summary})`) : ''}`,
      );
    }

    if (result.exitCode !== 0) {
      log.fail('Pipeline failed');
      for (const ctx of result.contexts) {
        if (ctx.diff?.hasBreaking) {
          console.error(formatDiffReport(ctx.diff));
        }
      }
    } else {
      log.ok('API Sync completed successfully.');
    }

    return result.exitCode;
  } catch (e) {
    spinner.fail('Sync failed');
    log.fail(e instanceof Error ? e.message : String(e));
    return 1;
  }
}
