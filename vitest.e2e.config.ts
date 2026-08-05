import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    name: 'e2e',
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@somedayyoung/core': path.join(repoRoot, 'packages/core/src/index.ts'),
    },
  },
});
