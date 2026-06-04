import { cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const pkgRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  async onSuccess() {
    await cp(
      path.join(pkgRoot, 'src/scaffold/templates'),
      path.join(pkgRoot, 'dist/scaffold/templates'),
      { recursive: true },
    );
  },
});
