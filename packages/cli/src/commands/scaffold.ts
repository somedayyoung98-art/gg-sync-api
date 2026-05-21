import path from 'node:path';
import pc from 'picocolors';
import { runScaffold } from '../scaffold/run.js';
import { createDelayedSpinner, log } from '../ui/logger.js';

export interface ScaffoldCommandOptions {
  cwd?: string;
  force?: boolean;
  apiDir?: string;
}

export async function scaffoldCommand(
  options: ScaffoldCommandOptions = {},
): Promise<number> {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const apiRoot = path.resolve(cwd, options.apiDir ?? 'src/api');
  const spinner = createDelayedSpinner(
    `Scaffolding API layout at ${log.cyan(apiRoot)}`,
  );

  try {
    const result = await runScaffold({
      cwd,
      apiDir: options.apiDir,
      force: options.force,
    });
    spinner.succeed('Scaffold complete');

    if (result.created.length > 0) {
      console.log(pc.green('Created:'));
      for (const file of result.created) {
        console.log(`  ${pc.dim(path.join(apiRoot, file))}`);
      }
    }

    if (result.skipped.length > 0) {
      console.log(pc.yellow('Skipped (already exists):'));
      for (const file of result.skipped) {
        console.log(`  ${pc.dim(file)}`);
      }
      console.log(
        pc.dim('Use --force to replace files that are empty stubs only.'),
      );
    }

    console.log('');
    console.log(pc.bold('Import boundary:'));
    console.log(
      pc.dim('  UI/features → domain/ only — never import from generated/ directly.'),
    );

    return result.exitCode;
  } catch (e) {
    spinner.fail('Scaffold failed');
    log.fail(e instanceof Error ? e.message : String(e));
    return 1;
  }
}
