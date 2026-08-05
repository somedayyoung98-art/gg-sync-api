import { cac } from 'cac';
import '@somedayyoung/generator-orval';
import packageJson from '../package.json';
import { runCommand } from './commands/run';
import { diffCommand } from './commands/diff';
import { scaffoldCommand } from './commands/scaffold';
import { attachSharedOptions, type SharedCommandOptions } from './options';

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
cli.version(packageJson.version);

const argv = process.argv.slice(2);
if (argv.length === 0) {
  argv.push('run');
}
cli.parse(['node', 'sync-api', ...argv]);
