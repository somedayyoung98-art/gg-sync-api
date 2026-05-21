import { cac } from 'cac';
import '@gg-sync/generator-orval';
import { runCommand } from './commands/run.js';
import { diffCommand } from './commands/diff.js';
import { scaffoldCommand } from './commands/scaffold.js';
import { doctorCommand } from './commands/doctor.js';
import { attachSharedOptions, type SharedCommandOptions } from './options.js';

const cli = cac('sync-api');

function bindPipelineCommand(
  name: string,
  description: string,
  handler: (options: SharedCommandOptions) => Promise<number>,
): void {
  const cmd = cli.command(name, description);
  attachSharedOptions(cmd);
  cmd.action(async (options: SharedCommandOptions) => {
    const code = await handler(options);
    process.exit(code);
  });
}

bindPipelineCommand('run', 'Pull schema, diff, and generate artifacts', runCommand);
bindPipelineCommand('diff', 'Pull schema and compare against baseline only', diffCommand);
bindPipelineCommand('[run]', 'Default: pull, diff, generate', runCommand);

cli
  .command('doctor', 'Validate config, peers, and output directories')
  .option('--config <path>', 'Config file path', { default: './api-sync.config.ts' })
  .option('--cwd <dir>', 'Working directory')
  .action(async (options: { cwd?: string; config?: string }) => {
    const code = await doctorCommand(options);
    process.exit(code);
  });

cli
  .command('scaffold', 'Create src/api generated, runtime, and domain layout')
  .option('--cwd <dir>', 'Working directory')
  .option('--api-dir <path>', 'API root directory', { default: 'src/api' })
  .option('--force', 'Overwrite scaffold files only when target is empty')
  .action(async (options: { cwd?: string; apiDir?: string; force?: boolean }) => {
    const code = await scaffoldCommand({
      cwd: options.cwd,
      apiDir: options.apiDir,
      force: options.force,
    });
    process.exit(code);
  });

cli.help();
cli.version('0.0.0');

const argv = process.argv.slice(2);
if (argv.length === 0) {
  argv.push('run');
}
cli.parse(['node', 'sync-api', ...argv]);
