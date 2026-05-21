import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import semver from 'semver';
import type { GeneratorId } from '../pipeline/types.js';
import { getGenerator } from '../plugins/registry.js';
import {
  DEFAULT_PLUGIN_PEERS,
  PLUGIN_GENERATOR_IDS,
} from './plugin-packages.js';
import { registerBuiltinPlugins } from '../plugins/builtins.js';
import { loadPluginsForGenerators, type PluginLoadIssue } from './load-plugins.js';

export interface PeerIssue {
  generator: GeneratorId;
  packageName: string;
  requiredRange: string;
  message: string;
  installHint: string;
}

export interface PeerCheckResult {
  ok: boolean;
  pluginLoadIssues: PluginLoadIssue[];
  peerIssues: PeerIssue[];
}

function readConsumerPackage(cwd: string): Record<string, unknown> | null {
  try {
    const raw = readFileSync(path.join(cwd, 'package.json'), 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isDeclaredDependency(cwd: string, packageName: string): boolean {
  const pkg = readConsumerPackage(cwd);
  if (!pkg) return false;
  const sections = ['dependencies', 'devDependencies', 'peerDependencies'] as const;
  for (const key of sections) {
    const deps = pkg[key] as Record<string, string> | undefined;
    if (deps && packageName in deps) return true;
  }
  return false;
}

function resolveInstalledVersion(cwd: string, packageName: string): string | null {
  if (!isDeclaredDependency(cwd, packageName)) {
    return null;
  }

  const req = createRequire(path.join(cwd, 'package.json'));
  try {
    const pkgPath = req.resolve(`${packageName}/package.json`);
    const pkg = req(pkgPath) as { version?: string };
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

function peersForGenerator(generatorId: GeneratorId): Record<string, string> {
  const plugin = getGenerator(generatorId);
  if (plugin?.peerDependencies) return plugin.peerDependencies;
  return DEFAULT_PLUGIN_PEERS[generatorId] ?? {};
}

export async function checkPeers(
  cwd: string,
  generators: GeneratorId[],
): Promise<PeerCheckResult> {
  const enabled = new Set(generators);
  await registerBuiltinPlugins(generators);
  const pluginLoadIssues = await loadPluginsForGenerators(generators);
  const peerIssues: PeerIssue[] = [];

  for (const generatorId of PLUGIN_GENERATOR_IDS) {
    if (!enabled.has(generatorId)) continue;

    for (const [packageName, requiredRange] of Object.entries(
      peersForGenerator(generatorId),
    )) {
      const installed = resolveInstalledVersion(cwd, packageName);
      if (!installed) {
        peerIssues.push({
          generator: generatorId,
          packageName,
          requiredRange,
          message: `Missing peer dependency ${packageName}@${requiredRange}`,
          installHint: `pnpm add ${packageName}`,
        });
        continue;
      }

      if (!semver.satisfies(installed, requiredRange, { includePrerelease: true })) {
        peerIssues.push({
          generator: generatorId,
          packageName,
          requiredRange,
          message: `${packageName}@${installed} does not satisfy ${requiredRange}`,
          installHint: `pnpm add ${packageName}@${requiredRange}`,
        });
      }
    }
  }

  return {
    ok: pluginLoadIssues.length === 0 && peerIssues.length === 0,
    pluginLoadIssues,
    peerIssues,
  };
}

export function formatPeerCheckReport(result: PeerCheckResult): string {
  const lines: string[] = [];

  for (const issue of result.pluginLoadIssues) {
    lines.push(
      `✖ ${issue.packageName} required for generator "${issue.generator}" — ${issue.installHint}`,
    );
  }

  for (const issue of result.peerIssues) {
    lines.push(
      `✖ @gg-sync/plugin-${issue.generator} requires peer ${issue.packageName}@${issue.requiredRange} — install: ${issue.installHint}`,
    );
  }

  return lines.join('\n');
}
