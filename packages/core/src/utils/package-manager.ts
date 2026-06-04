export type PackageManager = 'npm' | 'pnpm' | 'yarn';

function pmFromUserAgent(ua: string): PackageManager | null {
  const primary = ua.split(/\s+/)[0] ?? '';
  if (primary.startsWith('pnpm/')) return 'pnpm';
  if (primary.startsWith('yarn/')) return 'yarn';
  if (primary.startsWith('npm/')) return 'npm';
  return null;
}

/** Detect the package manager invoking the current process (sync-api / vitest / npm run). */
export function detectPackageManager(): PackageManager {
  if (process.env.PNPM_SCRIPT_SRC_DIR !== undefined) return 'pnpm';

  const ua = process.env.npm_config_user_agent ?? '';
  const fromUa = pmFromUserAgent(ua);
  if (fromUa) return fromUa;

  const execPath = process.env.npm_execpath ?? '';
  if (/[/\\]pnpm[/\\].*pnpm\.c?js/i.test(execPath)) return 'pnpm';
  if (/[/\\]yarn[/\\]/i.test(execPath)) return 'yarn';
  if (/npm-cli\.js/i.test(execPath)) return 'npm';

  return 'npm';
}

/** Human-readable install command for a missing dependency or peer. */
export function formatInstallHint(
  packageName: string,
  options?: { dev?: boolean; version?: string },
  pm: PackageManager = detectPackageManager(),
): string {
  const spec = options?.version ? `${packageName}@${options.version}` : packageName;

  if (pm === 'yarn') {
    return options?.dev ? `yarn add -D ${spec}` : `yarn add ${spec}`;
  }
  if (pm === 'npm') {
    return options?.dev ? `npm install -D ${spec}` : `npm install ${spec}`;
  }
  return options?.dev ? `pnpm add -D ${spec}` : `pnpm add ${spec}`;
}
