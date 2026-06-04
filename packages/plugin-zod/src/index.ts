import { register, type GeneratorPlugin } from '@gg-sync/core';
import { runOrvalGenerate } from '@gg-sync/generator-orval';

const zodPlugin: GeneratorPlugin = {
  id: 'zod',
  peerDependencies: {
    zod: '^3.24.0',
  },
  async generate(ctx) {
    await runOrvalGenerate(ctx);
  },
};

register(zodPlugin);

export { zodPlugin };
export const PLUGIN_ID = 'zod' as const;
