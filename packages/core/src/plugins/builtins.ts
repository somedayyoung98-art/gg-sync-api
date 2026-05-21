import type { GeneratorId } from '../pipeline/types.js';
import {
  PLUGIN_GENERATOR_IDS,
  PLUGIN_PACKAGE_BY_GENERATOR,
} from '../doctor/plugin-packages.js';

/**
 * Dynamically import optional generator plugins so they self-register
 * in the global plugin registry (react-query, msw, zod).
 */
export async function registerBuiltinPlugins(
  generators: GeneratorId[],
): Promise<void> {
  const enabled = new Set(generators);

  for (const id of PLUGIN_GENERATOR_IDS) {
    if (!enabled.has(id)) continue;
    const packageName = PLUGIN_PACKAGE_BY_GENERATOR[id];
    if (!packageName) continue;
    await import(packageName);
  }
}
