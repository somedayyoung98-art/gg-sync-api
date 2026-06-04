import { register, type GeneratorPlugin } from '@somedayyoung/core';
import { runOrvalGenerate } from '@somedayyoung/generator-orval';

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
