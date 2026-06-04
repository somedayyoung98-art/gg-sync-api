import type { GeneratorId } from '../pipeline/types';

export const PLUGIN_GENERATOR_IDS: GeneratorId[] = ['react-query', 'msw', 'zod'];

export const PLUGIN_PACKAGE_BY_GENERATOR: Partial<Record<GeneratorId, string>> = {
  'react-query': '@somedayyoung/plugin-react-query',
  msw: '@somedayyoung/plugin-msw',
  zod: '@somedayyoung/plugin-zod',
};

/** Fallback peers when plugin package is not loaded yet. */
export const DEFAULT_PLUGIN_PEERS: Partial<
  Record<GeneratorId, Record<string, string>>
> = {
  'react-query': { '@tanstack/react-query': '^5.0.0' },
  msw: { msw: '^2.0.0' },
  zod: { zod: '^3.24.0' },
};
