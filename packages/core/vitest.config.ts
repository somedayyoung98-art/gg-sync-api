import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const coreRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@gg-sync/core': path.join(coreRoot, 'src/index.ts'),
      '@gg-sync/generator-orval': path.join(
        coreRoot,
        '../generator-orval/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
  },
});
