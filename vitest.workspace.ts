import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/core/vitest.config.ts',
  'packages/cli/vitest.config.ts',
  'packages/runtime/vitest.config.ts',
  'packages/plugin-msw/vitest.config.ts',
  'vitest.e2e.config.ts',
]);
