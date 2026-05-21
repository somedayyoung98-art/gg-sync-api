import type { GeneratorId } from '../pipeline/types.js';

export const PLUGIN_GENERATOR_IDS: GeneratorId[] = ['react-query', 'msw', 'zod'];

export const PLUGIN_PACKAGE_BY_GENERATOR: Partial<Record<GeneratorId, string>> = {
  'react-query': '@gg-sync/plugin-react-query',
  msw: '@gg-sync/plugin-msw',
  zod: '@gg-sync/plugin-zod',
};

/** Fallback peers when plugin package is not loaded yet. */
export const DEFAULT_PLUGIN_PEERS: Partial<
  Record<GeneratorId, Record<string, string>>
> = {
  'react-query': { '@tanstack/react-query': '^5.0.0' },
  msw: { msw: '^2.0.0' },
  zod: { zod: '^3.24.0' },
};
