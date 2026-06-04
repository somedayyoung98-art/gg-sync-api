import type { GeneratorId } from '../pipeline/types';
import { registerBuiltinPlugins } from '../plugins/builtins';
import { formatInstallHint } from '../utils/package-manager';
import {
  PLUGIN_GENERATOR_IDS,
  PLUGIN_PACKAGE_BY_GENERATOR,
} from './plugin-packages';

export interface PluginLoadIssue {
  generator: GeneratorId;
  packageName: string;
  message: string;
  installHint: string;
}

export async function loadPluginsForGenerators(
  generators: GeneratorId[],
): Promise<PluginLoadIssue[]> {
  const issues: PluginLoadIssue[] = [];
  const enabled = new Set(generators);

  for (const id of PLUGIN_GENERATOR_IDS) {
    if (!enabled.has(id)) continue;
    const packageName = PLUGIN_PACKAGE_BY_GENERATOR[id];
    if (!packageName) continue;

    try {
      await registerBuiltinPlugins([id]);
    } catch {
      issues.push({
        generator: id,
        packageName,
        message: `Optional package ${packageName} is not installed`,
        installHint: formatInstallHint(packageName, { dev: true }),
      });
    }
  }

  return issues;
}
