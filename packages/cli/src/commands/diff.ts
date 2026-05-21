import path from 'node:path';
import pc from 'picocolors';
import {
  formatDiffReport,
  loadConfig,
  resolveAllServices,
  runPipeline,
} from '@gg-sync/core';
import type { SharedCommandOptions } from '../options.js';
import { resolveNamespaceFilter, resolveStrictFlag } from '../options.js';
import { createDelayedSpinner, createSpinner, log } from '../ui/logger.js';

export async function diffCommand(
  options: SharedCommandOptions = {},
): Promise<number> {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const configPath = options.config
    ? path.resolve(cwd, options.config)
    : path.join(cwd, 'api-sync.config.ts');

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

    const runSpinner = createDelayedSpinner('Running contract diff');
    const result = await runPipeline({
      cwd,
      services,
      namespaceFilter,
      mode: 'diff-only',
    });
    runSpinner.stop();

    for (const ctx of result.contexts) {
      const status = ctx.meta.exitCode === 0 ? pc.green('ok') : pc.red('fail');
      console.log(
        `${status} ${log.bold(ctx.namespace)} ${ctx.diff?.summary ? pc.dim(`(${ctx.diff.summary})`) : ''}`,
      );
      if (ctx.diff && (ctx.diff.breaking.length > 0 || ctx.diff.nonBreaking.length > 0)) {
        console.log(pc.dim(formatDiffReport(ctx.diff)));
      }
    }

    if (result.exitCode !== 0) {
      log.fail('Diff failed (breaking changes in strict mode)');
    }

    return result.exitCode;
  } catch (e) {
    spinner.fail('Diff failed');
    log.fail(e instanceof Error ? e.message : String(e));
    return 1;
  }
}
