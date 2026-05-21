import { register, type GeneratorPlugin } from '@gg-sync/core';
import { runOrvalGenerate } from '@gg-sync/generator-orval';

const reactQueryPlugin: GeneratorPlugin = {
  id: 'react-query',
  peerDependencies: {
    '@tanstack/react-query': '^5.0.0',
  },
  async generate(ctx) {
    await runOrvalGenerate(ctx);
  },
};

register(reactQueryPlugin);

export { reactQueryPlugin };
export const PLUGIN_ID = 'react-query' as const;
