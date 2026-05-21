import type { GeneratorId } from '../pipeline/types.js';
import type { GeneratorPlugin } from './types.js';

const plugins = new Map<GeneratorId, GeneratorPlugin>();

export function register(plugin: GeneratorPlugin): void {
  plugins.set(plugin.id, plugin);
}

export function getGenerator(id: GeneratorId): GeneratorPlugin | undefined {
  return plugins.get(id);
}

export function listGenerators(): GeneratorId[] {
  return [...plugins.keys()];
}

export function clearRegistry(): void {
  plugins.clear();
}
