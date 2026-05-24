import './env.js';

/**
 * Optional MSW mock generation example.
 *
 * Usage:
 *   1. pnpm add -D msw
 *   2. Copy this file to api-sync.config.ts (or merge generators)
 *   3. pnpm sync-api doctor && pnpm sync-api run
 *
 * Output: src/api/generated/*.msw.ts (Orval MSW handlers from the same OpenAPI contract)
 */
export default {
  services: {
    main: {
      input: { path: './fixtures/openapi.json' },
      output: { dir: './src/api/generated' },
      generators: ['typescript', 'sdk', 'msw'],
      runtime: { baseURL: process.env.API_BASE_URL ?? 'http://localhost:3000' },
    },
  },
};
