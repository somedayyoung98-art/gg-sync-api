import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'release',
    environment: 'node',
    include: ['tests/release/**/*.test.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
});
