import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const cliRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@gg-sync/core': path.join(cliRoot, '../core/src/index.ts'),
      '@gg-sync/generator-orval': path.join(
        cliRoot,
        '../generator-orval/src/index.ts',
      ),
      '@gg-sync/plugin-react-query': path.join(
        cliRoot,
        '../plugin-react-query/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
  },
});
