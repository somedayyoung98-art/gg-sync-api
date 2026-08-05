import fs from 'node:fs/promises';
import path from 'node:path';
import type { GeneratorId } from '@somedayyoung/core';

export async function pruneClientArtifacts(
  outputDir: string,
  generators: readonly GeneratorId[],
): Promise<void> {
  const enabled = new Set(generators);

  if (!enabled.has('sdk')) {
    await fs.rm(path.join(outputDir, 'sdk.ts'), { force: true });
  }
  if (!enabled.has('react-query')) {
    await fs.rm(path.join(outputDir, 'hooks.ts'), { force: true });
  }
  if (!enabled.has('zod')) {
    await fs.rm(path.join(outputDir, 'zod.ts'), { force: true });
  }
  if (!enabled.has('msw')) {
    const entries = await fs.readdir(outputDir);
    for (const name of entries) {
      if (name.endsWith('.msw.ts')) {
        await fs.unlink(path.join(outputDir, name));
      }
    }
  }
}
