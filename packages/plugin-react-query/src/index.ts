import { register, type GeneratorPlugin } from '@somedayyoung/core';
import { runOrvalGenerate } from '@somedayyoung/generator-orval';

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
