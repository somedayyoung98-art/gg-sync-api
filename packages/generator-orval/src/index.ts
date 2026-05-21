import { register, type GeneratorPlugin, type PipelineContext } from '@gg-sync/core';
import { runOrvalGenerate } from './orval-bridge.js';

const orvalRan = new WeakSet<PipelineContext>();

async function orvalOnce(ctx: PipelineContext): Promise<void> {
  if (orvalRan.has(ctx)) return;
  orvalRan.add(ctx);
  await runOrvalGenerate(ctx);
}

const typescriptPlugin: GeneratorPlugin = {
  id: 'typescript',
  async generate(ctx) {
    await orvalOnce(ctx);
  },
};

const sdkPlugin: GeneratorPlugin = {
  id: 'sdk',
  async generate(ctx) {
    await orvalOnce(ctx);
  },
};

register(typescriptPlugin);
register(sdkPlugin);

/** Import side-effect for CLI bootstrap */
export function registerOrvalPlugins(): void {
  /* plugins registered at module load */
}

export { runOrvalGenerate } from './orval-bridge.js';
export { mapToOrvalConfig } from './map-config.js';
