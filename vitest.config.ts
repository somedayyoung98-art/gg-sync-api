import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      path.join(repoRoot, 'packages/core/vitest.config.ts'),
      path.join(repoRoot, 'packages/cli/vitest.config.ts'),
      path.join(repoRoot, 'packages/runtime/vitest.config.ts'),
      path.join(repoRoot, 'packages/plugin-msw/vitest.config.ts'),
      path.join(repoRoot, 'vitest.regression.config.ts'),
      path.join(repoRoot, 'vitest.e2e.config.ts'),
    ],
  },
});
