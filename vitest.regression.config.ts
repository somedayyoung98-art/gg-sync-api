import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    name: 'regression',
    environment: 'node',
    include: ['tests/regression/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@somedayyoung/core': path.join(repoRoot, 'packages/core/src/index.ts'),
      '@somedayyoung/generator-orval': path.join(
        repoRoot,
        'packages/generator-orval/src/index.ts',
      ),
    },
  },
});
