import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import path from 'node:path';

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

function pmFromUserAgent(ua: string): PackageManager | null {
  const primary = ua.split(/\s+/)[0] ?? '';
  if (primary.startsWith('pnpm/')) return 'pnpm';
  if (primary.startsWith('yarn/')) return 'yarn';
  if (primary.startsWith('npm/')) return 'npm';
  return null;
}

export function detectPackageManager(): PackageManager {
  if (process.env.PNPM_SCRIPT_SRC_DIR !== undefined) return 'pnpm';

  const fromUa = pmFromUserAgent(process.env.npm_config_user_agent ?? '');
  if (fromUa) return fromUa;

  const execPath = process.env.npm_execpath ?? '';
  if (/[/\\]pnpm[/\\].*pnpm\.c?js/i.test(execPath)) return 'pnpm';
  if (/[/\\]yarn[/\\]/i.test(execPath)) return 'yarn';
  if (/npm-cli\.js/i.test(execPath)) return 'npm';

  return 'npm';
}

type ExecOptions = {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  stdio?: 'inherit' | 'pipe';
};

/** Run a PM binary without shell (Windows uses cmd /c to avoid DEP0190 and EINVAL on .cmd). */
function execPmArgv(pm: PackageManager, args: string[], options: ExecOptions): void {
  const stdio = options.stdio ?? 'pipe';
  const execOpts = {
    cwd: options.cwd,
    stdio,
    env: options.env ?? process.env,
    shell: false as const,
  };

  if (process.platform === 'win32') {
    const comspec = process.env.ComSpec ?? 'cmd.exe';
    execFileSync(comspec, ['/d', '/s', '/c', pm, ...args], execOpts);
    return;
  }
  execFileSync(pm, args, execOpts);
}

function spawnPmArgv(
  pm: PackageManager,
  args: string[],
  options: ExecOptions & { stdio?: 'pipe' | 'inherit' },
): ChildProcess {
  const spawnOpts = {
    cwd: options.cwd,
    stdio: options.stdio ?? 'pipe',
    env: options.env ?? process.env,
    shell: false as const,
  };

  if (process.platform === 'win32') {
    const comspec = process.env.ComSpec ?? 'cmd.exe';
    return spawn(comspec, ['/d', '/s', '/c', pm, ...args], spawnOpts);
  }
  return spawn(pm, args, spawnOpts);
}

/** Run a package.json script in cwd. */
export function spawnPmScript(
  script: string,
  options: { cwd: string; env?: NodeJS.ProcessEnv; stdio?: 'pipe' | 'inherit' },
): ChildProcess {
  const pm = detectPackageManager();
  const args = ['run', script];
  return spawnPmArgv(pm, args, options);
}

/** Run workspace root build when CLI dist is missing. */
export function execPmBuild(cwd: string, stdio: 'inherit' | 'pipe' = 'inherit'): void {
  const pm = detectPackageManager();
  if (pm === 'pnpm' || pm === 'yarn') {
    execPmArgv(pm, ['build'], { cwd, stdio });
    return;
  }
  execPmArgv('npm', ['run', 'build'], { cwd, stdio });
}

/** Run the sync-api binary installed by the consumer workspace. */
export function execSyncApi(
  args: string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv; stdio?: 'inherit' | 'pipe' },
): void {
  const bin = path.join(
    options.cwd,
    'node_modules',
    '@somedayyoung',
    'api-sync',
    'bin',
    'sync-api.js',
  );
  execFileSync(process.execPath, [bin, ...args], {
    cwd: options.cwd,
    stdio: options.stdio ?? 'pipe',
    env: options.env ?? process.env,
  });
}
