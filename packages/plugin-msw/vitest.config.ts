import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const pkgRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@somedayyoung/core': path.join(pkgRoot, '../core/src/index.ts'),
      '@somedayyoung/generator-orval': path.join(pkgRoot, '../generator-orval/src/index.ts'),
      '@somedayyoung/plugin-msw': path.join(pkgRoot, './src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
  },
});
