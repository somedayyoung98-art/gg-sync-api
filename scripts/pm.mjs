import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function detectPackageManager() {
  const ua = process.env.npm_config_user_agent ?? '';
  if (/\bpnpm\b/i.test(ua)) return 'pnpm';
  if (/\byarn\b/i.test(ua)) return 'yarn';
  return 'npm';
}

export function run(command, options = {}) {
  const cwd = options.cwd ?? rootDir;
  execSync(command, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
}

/** Run a script in every workspace package (topological order handled by the PM). */
export function runInAllWorkspaces(script) {
  const pm = detectPackageManager();
  if (pm === 'pnpm') {
    run(`pnpm -r run ${script}`);
    return;
  }
  if (pm === 'yarn') {
    run(`yarn workspaces foreach -Apt run ${script}`);
    return;
  }
  run(`npm run ${script} --workspaces --if-present`);
}

/** Run a script in one workspace package by npm name (e.g. @gg-sync/core). */
export function runInWorkspace(packageName, script) {
  const pm = detectPackageManager();
  if (pm === 'pnpm') {
    run(`pnpm --filter ${packageName} run ${script}`);
    return;
  }
  if (pm === 'yarn') {
    run(`yarn workspace ${packageName} run ${script}`);
    return;
  }
  run(`npm run ${script} -w ${packageName}`);
}

/** exec a package binary from a workspace (e.g. sync-api in @gg-sync/api-sync). */
export function execInWorkspace(packageName, args) {
  const pm = detectPackageManager();
  const cmd = `${args.join(' ')}`;
  if (pm === 'pnpm') {
    run(`pnpm --filter ${packageName} exec ${cmd}`);
    return;
  }
  if (pm === 'yarn') {
    run(`yarn workspace ${packageName} exec ${cmd}`);
    return;
  }
  run(`npm exec -w ${packageName} -- ${cmd}`);
}

function printUsage() {
  console.log(`Usage: node scripts/pm.mjs <command>

Commands:
  build-all          Build all workspace packages
  test-packages      Run tests in all workspace packages
  test-e2e           Run root e2e vitest project
  exec-api-sync      Forward args to sync-api CLI (e.g. run --strict)
`);
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCli) {
  const [command, ...rest] = process.argv.slice(2);

  if (!command) {
    printUsage();
    process.exit(1);
  }

  try {
    switch (command) {
      case 'build-all':
        runInAllWorkspaces('build');
        break;
      case 'test-packages':
        runInAllWorkspaces('test');
        break;
      case 'test-e2e':
        run('npx vitest run --project e2e');
        break;
      case 'exec-api-sync':
        execInWorkspace('@gg-sync/api-sync', rest);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    process.exit(error.status ?? 1);
  }
}
