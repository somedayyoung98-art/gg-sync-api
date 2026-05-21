import path from 'node:path';
import {
  formatPeerCheckReport,
  loadConfig,
  resolveAllServices,
  runDoctorStage,
} from '@gg-sync/core';
import { createDelayedSpinner, log } from '../ui/logger.js';

export interface DoctorCommandOptions {
  config?: string;
  cwd?: string;
}

export async function doctorCommand(
  options: DoctorCommandOptions = {},
): Promise<number> {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const configPath = options.config
    ? path.resolve(cwd, options.config)
    : path.join(cwd, 'api-sync.config.ts');

  const spinner = createDelayedSpinner('Running doctor checks');

  try {
    const config = await loadConfig({ cwd, configPath });
    const services = resolveAllServices(config);
    const result = await runDoctorStage(cwd, services);
    spinner.stop();

    if (result.ok) {
      log.ok('✓ All doctor checks passed');
      for (const service of services) {
        log.dim(`  ${service.namespace}: ${service.generators.join(', ')}`);
      }
      return 0;
    }

    const report = formatPeerCheckReport(result);
    if (report) log.fail(report);
    for (const line of result.outputDirIssues) {
      log.fail(`✖ ${line}`);
    }
    return 1;
  } catch (e) {
    spinner.fail('Doctor failed');
    log.fail(e instanceof Error ? e.message : String(e));
    return 1;
  }
}
