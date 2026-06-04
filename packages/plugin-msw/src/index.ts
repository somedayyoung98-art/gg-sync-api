import { register, type GeneratorPlugin } from '@gg-sync/core';
import { runOrvalGenerate } from '@gg-sync/generator-orval';

const mswPlugin: GeneratorPlugin = {
  id: 'msw',
  peerDependencies: {
    msw: '^2.0.0',
  },
  async generate(ctx) {
    await runOrvalGenerate(ctx);
  },
};

register(mswPlugin);

export { mswPlugin };
export const PLUGIN_ID = 'msw' as const;
